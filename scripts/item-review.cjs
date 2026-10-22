const {createHash}=require('node:crypto');
const {makeFour}=require('./four-editions.cjs');
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const localErrors=new Set(['invalid_events','invalid_event_sources','invalid_edition_membership','invalid_localized_text','translation_number_conflict','unsupported_number','unsupported_quote','daily_text_budget_exceeded','irrelevant_event','edition_event_limit','invalid_specialist_event','specialist_topic_limit','invalid_specialist_text','specialist_translation_numbers','specialist_unsupported_number','specialist_unsupported_quote','invalid_cyber_observation','unsupported_observation_number']);
function envelope(generated){
  if(!generated||Object.keys(generated).sort().join(',')!=='events,observations,specialistEvents'||!Array.isArray(generated.events)||!Array.isArray(generated.specialistEvents)||!Array.isArray(generated.observations)||generated.events.length+generated.specialistEvents.length>40||generated.observations.length>3)throw Error('invalid_model_output');
}
function candidates(generated){return [['daily',generated.events],['specialist',generated.specialistEvents],['observation',generated.observations]].flatMap(([kind,items])=>items.map((value,i)=>({id:`${kind}-${i+1}`,digest:digest(value),kind,value})));}
function assemble(context,items){
  const events=items.filter(i=>i.kind==='daily').map(i=>i.value),specialistEvents=items.filter(i=>i.kind==='specialist').map(i=>i.value),observations=items.filter(i=>i.kind==='observation').map(i=>i.value);
  return makeFour({...context,events,specialistEvents,observations,review:{approved:true,checkedIds:[...events,...specialistEvents].flatMap(e=>e.sourceIds)}});
}
function preflight(context,generated){
  envelope(generated);
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
    if(!decision||Object.keys(decision).sort().join(',')!=='approved,digest,id,reason'||!item||byId.has(decision.id)||decision.digest!==item.digest||typeof decision.approved!=='boolean'||typeof decision.reason!=='string'||decision.reason.length<1||decision.reason.length>240||/[\r\n<>]/.test(decision.reason))throw Error('invalid_item_review');
    byId.set(decision.id,decision);
  }
  const accepted=[],quarantined=[...initial.quarantined];
  for(const item of initial.retained){
    const decision=byId.get(item.id);
    if(!decision.approved){quarantined.push({id:item.id,digest:item.digest,code:'editorial_rejected'});continue;}
    if(item.kind==='observation'&&item.value.eventIds.some(id=>!accepted.some(i=>i.kind==='specialist'&&i.value.stream==='security'&&i.value.id===id))){quarantined.push({id:item.id,digest:item.digest,code:'rejected_observation_dependency'});continue;}
    accepted.push(item);
  }
  if(!accepted.some(i=>i.kind!=='observation')&&(generated.events.length||generated.specialistEvents.length))throw Error('all_items_rejected');
  const base=assemble(context,accepted);
  return {...base,schemaVersion:7,itemReview:{generated,review,quarantined}};
}
function validateSelected(bundle,date){
  if(bundle?.schemaVersion!==7||!bundle.itemReview||Object.keys(bundle.itemReview).sort().join(',')!=='generated,quarantined,review')throw Error('invalid_publication_bundle');
  const context={date,revision:bundle.revision,sources:bundle.sources,report:bundle.specialist?.report,publishedAt:bundle.specialist?.candidate?.publishedAt};
  const reconstructed=select(context,bundle.itemReview.generated,bundle.itemReview.review);
  if(JSON.stringify(reconstructed)!==JSON.stringify(bundle))throw Error('invalid_publication_bundle');
  return reconstructed.files;
}
function historyHints(values){
  if(values.some(v=>typeof v!=='string'||v.length<8||v.length>100||/[\r\n<>]/.test(v)))throw Error('invalid_event_history');
  const unique=[...new Set(values)];if(unique.length>560)throw Error('invalid_event_history');return unique;
}
module.exports={digest,candidates,preflight,select,validateSelected,historyHints};
