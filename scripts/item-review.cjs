const {createHash}=require('node:crypto');
const {makeFour}=require('./four-editions.cjs');
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
function evidenceFingerprint(source){return digest([source.url,source.publishedAt,source.excerptHash]);}
function validateDuplicateEvidence(values,limit=560){
  if(!Array.isArray(values)||values.length>limit||new Set(values).size!==values.length||values.some(v=>typeof v!=='string'||!/^[a-f0-9]{64}$/.test(v)))throw Error('invalid_duplicate_history');
  return values;
}
function modernContext(context){
  if(context.schemaVersion!==8)return;
  if(JSON.stringify(historyHints(context.previousEvents))!==JSON.stringify(context.previousEvents))throw Error('invalid_event_history');
  validateDuplicateEvidence(context.duplicateEvidence);
}
const localErrors=new Set(['historical_duplicate','invalid_events','invalid_event_sources','invalid_edition_membership','invalid_localized_text','translation_number_conflict','unsupported_number','unsupported_quote','daily_text_budget_exceeded','irrelevant_event','edition_event_limit','invalid_specialist_event','specialist_topic_limit','invalid_specialist_text','specialist_translation_numbers','specialist_unsupported_number','specialist_unsupported_quote','invalid_cyber_observation','unsupported_observation_number']);
function envelope(generated){
  if(!generated||Object.keys(generated).sort().join(',')!=='events,observations,specialistEvents'||!Array.isArray(generated.events)||!Array.isArray(generated.specialistEvents)||!Array.isArray(generated.observations)||generated.events.length+generated.specialistEvents.length>40||generated.observations.length>3)throw Error('invalid_model_output');
}
function candidates(generated){return [['daily',generated.events],['specialist',generated.specialistEvents],['observation',generated.observations]].flatMap(([kind,items])=>items.map((value,i)=>({id:`${kind}-${i+1}`,digest:digest(value),kind,value})));}
function assemble(context,items){
  const events=items.filter(i=>i.kind==='daily').map(i=>i.value),specialistEvents=items.filter(i=>i.kind==='specialist').map(i=>i.value),observations=items.filter(i=>i.kind==='observation').map(i=>i.value);
  return makeFour({...context,milestones:context.schemaVersion===8,events,specialistEvents,observations,review:{approved:true,checkedIds:[...events,...specialistEvents].flatMap(e=>e.sourceIds)}});
}
function preflight(context,generated){
  envelope(generated);modernContext(context);
  // Source integrity remains fatal even when no draft uses the damaged record.
  assemble(context,[]);
  const retained=[],quarantined=[];
  for(const item of candidates(generated)){
    if(!item.value||typeof item.value!=='object'||Array.isArray(item.value)){
      quarantined.push({id:item.id,digest:item.digest,code:'invalid_item'});continue;
    }
    try{
      if(item.kind!=='observation'&&!Array.isArray(item.value.sourceIds))throw Error('invalid_event_sources');
      if(item.kind==='daily'&&!Object.hasOwn(item.value,'editions'))throw Error('invalid_edition_membership');
      if(context.schemaVersion===8&&item.kind!=='observation'&&item.value.sourceIds.some(id=>[...context.sources,...context.report.records].some(s=>s.id===id&&context.duplicateEvidence.includes(evidenceFingerprint(s)))))throw Error('historical_duplicate');
      if(item.kind!=='observation'&&(!Array.isArray(item.value.quotes)||item.value.quotes.some(q=>!q||typeof q!=='object')))throw Error('unsupported_quote');
      if(item.kind!=='observation'&&Array.isArray(item.value.sourceIds)&&item.value.sourceIds.some(id=>retained.some(i=>i.kind!=='observation'&&i.value.sourceIds.includes(id))))throw Error('invalid_event_sources');
      assemble(context,[...retained,item]);retained.push(item);
    }
    catch(error){if(!localErrors.has(error.message))throw error;quarantined.push({id:item.id,digest:item.digest,code:error.message});}
  }
  return {retained,quarantined};
}
function select(context,generated,review){
  const initial=preflight(context,generated);
  if(!review||Object.keys(review).sort().join(',')!=='decisions'||!Array.isArray(review.decisions)||review.decisions.length!==initial.retained.length)throw Error('invalid_item_review');
  const byId=new Map();
  for(const decision of review.decisions){
    const item=initial.retained.find(i=>i.id===decision?.id);
    const keys=context.schemaVersion===8?'approved,digest,duplicateOf,id,reason':'approved,digest,id,reason';
    if(!decision||Object.keys(decision).sort().join(',')!==keys||!item||byId.has(decision.id)||decision.digest!==item.digest||typeof decision.approved!=='boolean'||typeof decision.reason!=='string'||decision.reason.length<1||decision.reason.length>240||/[\r\n<>]/.test(decision.reason))throw Error('invalid_item_review');
    if(context.schemaVersion===8&&decision.duplicateOf!==null&&(decision.approved||item.kind==='observation'||typeof decision.duplicateOf!=='string'||!context.previousEvents.includes(decision.duplicateOf)))throw Error('invalid_item_review');
    byId.set(decision.id,decision);
  }
  const accepted=[],quarantined=[...initial.quarantined];
  for(const item of initial.retained){
    const decision=byId.get(item.id);
    if(!decision.approved){quarantined.push({id:item.id,digest:item.digest,code:context.schemaVersion===8&&decision.duplicateOf!==null?'historical_duplicate':'editorial_rejected'});continue;}
    if(item.kind==='observation'&&item.value.eventIds.some(id=>!accepted.some(i=>i.kind==='specialist'&&i.value.stream==='security'&&i.value.id===id))){quarantined.push({id:item.id,digest:item.digest,code:'rejected_observation_dependency'});continue;}
    accepted.push(item);
  }
  if(!accepted.some(i=>i.kind!=='observation')&&(generated.events.length||generated.specialistEvents.length))throw Error('all_items_rejected');
  const base=assemble(context,accepted);
  return {...base,schemaVersion:context.schemaVersion===8?8:7,itemReview:{generated,review,quarantined,...(context.schemaVersion===8?{previousEvents:context.previousEvents,duplicateEvidence:context.duplicateEvidence}:{})}};
}
function validateSelected(bundle,date){
  const modern=bundle?.schemaVersion===8;
  if(![7,8].includes(bundle?.schemaVersion)||!bundle.itemReview||Object.keys(bundle.itemReview).sort().join(',')!==(modern?'duplicateEvidence,generated,previousEvents,quarantined,review':'generated,quarantined,review'))throw Error('invalid_publication_bundle');
  const context={date,revision:bundle.revision,sources:bundle.sources,report:bundle.specialist?.report,publishedAt:bundle.specialist?.candidate?.publishedAt,...(modern?{schemaVersion:8,previousEvents:bundle.itemReview.previousEvents,duplicateEvidence:bundle.itemReview.duplicateEvidence}:{})};
  const reconstructed=select(context,bundle.itemReview.generated,bundle.itemReview.review);
  if(JSON.stringify(reconstructed)!==JSON.stringify(bundle))throw Error('invalid_publication_bundle');
  return reconstructed.files;
}
function rejectedDuplicateEvidence(bundle){
  if(bundle.schemaVersion!==8)return [];
  const sources=[...bundle.sources,...bundle.specialist.report.records];
  const rejected=new Set(bundle.itemReview.review.decisions.filter(d=>!d.approved&&d.duplicateOf!==null).map(d=>d.id));
  return validateDuplicateEvidence([...new Set(candidates(bundle.itemReview.generated).filter(i=>rejected.has(i.id)).flatMap(i=>i.value.sourceIds.map(id=>evidenceFingerprint(sources.find(s=>s.id===id)))))],40);
}
function historyHints(values){
  if(!Array.isArray(values))throw Error('invalid_event_history');
  if(values.some(v=>typeof v!=='string'||v.length<8||v.length>500||/[\r\n<>]/.test(v)))throw Error('invalid_event_history');
  const unique=[...new Set(values)];if(unique.length>560)throw Error('invalid_event_history');return unique;
}
module.exports={digest,candidates,preflight,select,validateSelected,historyHints,evidenceFingerprint,validateDuplicateEvidence,rejectedDuplicateEvidence};
