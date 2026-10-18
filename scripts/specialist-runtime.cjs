const {registry,collectSpecialists,collectSocial,evidence,dateValue,validWindow}=require('./specialist-news.cjs');
const {slot}=require('./rss-archive.cjs');
const {fetchFeed}=require('./feed-transport.cjs');
const {relevantIndonesia,relevantTech}=require('./news-relevance.cjs');
const {sourceTextForRelevance}=require('./news-evidence.cjs');
const DAY=86400000,HOUR=3600000;
const snapshotKey=instant=>`evidence/specialist-hour-${slot(instant)}.json`;
function windowFor(date){if(dateValue(date)?.precision!=='day')throw Error('invalid_specialist_window');return {start:new Date(Date.parse(date)-7*DAY).toISOString().slice(0,10),end:date};}
function validateRecords(report,instant){
  if(!report||Object.keys(report).sort().join(',')!=='collectedAt,complete,feeds,records,schemaVersion,window'||report.schemaVersion!==1||!validWindow(report.window)||!Array.isArray(report.records)||report.records.length>500||typeof report.collectedAt!=='string'||!Number.isFinite(Date.parse(report.collectedAt))||Date.parse(report.collectedAt)>instant.getTime()||!Array.isArray(report.feeds)||report.feeds.length!==registry.sources.length||typeof report.complete!=='boolean'||report.complete!==report.feeds.every(f=>f?.status==='ok')||Buffer.byteLength(JSON.stringify(report))>1048576)throw Error('invalid_specialist_report');
  for(const [i,source]of registry.sources.entries()){const feed=report.feeds[i];if(feed?.id!==source.id||feed.stream!==source.stream||!['ok','failed'].includes(feed.status)||report.records.some(r=>r.sourceId===source.id&&feed.status!=='ok'))throw Error('invalid_specialist_report');
    if(feed.status==='ok'&&(!['received','accepted','rejected','duplicates','truncated'].every(k=>Number.isInteger(feed[k])&&feed[k]>=0)||feed.accepted!==report.records.filter(r=>r.sourceId===source.id).length||feed.accepted>50||feed.received!==feed.accepted+feed.rejected+feed.duplicates+feed.truncated))throw Error('invalid_specialist_report');
    if(feed.status==='failed'&&!['feed_timeout','feed_size_limit','feed_response_rejected','source_structure_changed','source_date_conflict','source_collection_failed'].includes(feed.error))throw Error('invalid_specialist_report');}
  const ids=new Set(),urls=new Set();for(const record of report.records){const source=registry.sources.find(s=>s.id===record.sourceId);if(!source||!['published','updated','distributed'].includes(record.dateBasis)||typeof record.excerpt!=='string')throw Error('invalid_specialist_report');const description=record.excerpt.startsWith(record.title+'\n')?record.excerpt.slice(record.title.length+1):'';
    const reconstructed=evidence({title:record.title,url:record.url,dateRaw:record.dateRaw,dateBasis:record.dateBasis,description},source);
    if(!reconstructed||Object.keys(record).sort().join(',')!==Object.keys(reconstructed).sort().join(',')||Object.keys(reconstructed).some(k=>JSON.stringify(record[k])!==JSON.stringify(reconstructed[k]))||ids.has(record.id)||urls.has(record.url)||record.publishedAt.slice(0,10)<report.window.start||record.publishedAt.slice(0,10)>=report.window.end||Date.parse(record.publishedAt)>instant.getTime())throw Error('invalid_specialist_report');ids.add(record.id);urls.add(record.url);}
  return report;
}
function withoutSocial(report){const {schemaVersion,collectedAt,window,complete,feeds,records}=report;return {schemaVersion,collectedAt,window,complete,feeds,records};}
async function captureSpecialists({state,instant=new Date(),collect=collectSpecialists,social=collectSocial}={}){
  const key=snapshotKey(instant),prior=await state.read(key,{timeoutMs:3000});if(prior){validateRecords(prior.value,instant);if(slot(new Date(prior.value.collectedAt))!==slot(instant))throw Error('invalid_specialist_report');return {status:'already_captured',records:prior.value.records.length,modelCalls:0};}
  const today=instant.toISOString().slice(0,10),end=new Date(Date.parse(today)+DAY).toISOString().slice(0,10),window={start:new Date(Date.parse(end)-7*DAY).toISOString().slice(0,10),end};
  const report=withoutSocial(await collect(window,{now:()=>instant,fetch:(url,options)=>fetchFeed(url,{...options,timeoutMs:8000})}));validateRecords(report,instant);
  let status=report.complete?'captured':'captured_partial';try{await state.write(key,report);}catch(e){if(e.message!=='state_already_exists')throw e;status='already_captured';}
  const hour=Math.floor(instant.getTime()/HOUR),queries=['security','developer'].map(stream=>{const choices=registry.socialQueries.filter(q=>q.stream===stream);return choices[hour%choices.length];});
  const discovery=await social(window,{queries,now:()=>instant,fetch:(url,options)=>fetchFeed(url,{...options,timeoutMs:8000})});
  if(Buffer.byteLength(JSON.stringify(discovery))>131072)throw Error('specialist_social_size_limit');
  try{await state.write(`evidence/specialist-social-${slot(instant)}.json`,discovery);}catch(e){if(e.message!=='state_already_exists')throw e;}
  return {status,records:report.records.length,failedFeeds:report.feeds.filter(f=>f.status==='failed').map(f=>f.id),socialQueries:discovery.queries.length,socialCandidates:discovery.candidates.length,socialStatus:discovery.status,modelCalls:0};
}
async function collectDailySpecialists({state,date,instant=new Date(),collect=collectSpecialists}={}){
  const window=windowFor(date),live=withoutSocial(await collect(window,{now:()=>instant,fetch:(url,options)=>fetchFeed(url,{...options,timeoutMs:8000})}));validateRecords(live,instant);
  const coverage={expected:32,present:0,missing:[],failedReads:[],incomplete:[],conflictingUrls:[]},reports=[];
  const hours=Array.from({length:32},(_,i)=>new Date(Math.floor(instant.getTime()/HOUR)*HOUR-i*HOUR));
  for(let i=0;i<hours.length;i+=4){const batch=await Promise.all(hours.slice(i,i+4).map(async hour=>{try{return {hour,object:await state.read(snapshotKey(hour),{timeoutMs:3000})};}catch(e){if(e instanceof SyntaxError||e.message==='response_size_limit')throw Error('invalid_specialist_report');return {hour,failed:true};}}));for(const {hour,object,failed}of batch){if(failed){coverage.failedReads.push(slot(hour));continue;}if(!object){coverage.missing.push(slot(hour));continue;}validateRecords(object.value,instant);if(slot(new Date(object.value.collectedAt))!==slot(hour))throw Error('invalid_specialist_report');reports.push(object.value);coverage.present++;if(!object.value.complete)coverage.incomplete.push(slot(hour));}}
  const byUrl=new Map(),conflicts=new Set();for(const report of [...reports.reverse(),live])for(const record of report.records){if(record.publishedAt.slice(0,10)<window.start||record.publishedAt.slice(0,10)>=window.end)continue;const old=byUrl.get(record.url);if(old&&old.publishedAt!==record.publishedAt)conflicts.add(record.url);byUrl.set(record.url,record);}
  const records=[...byUrl.values()].filter(r=>!conflicts.has(r.url)).sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt));if(records.length>500)throw Error('specialist_record_limit');coverage.conflictingUrls=[...conflicts];
  // Merged health describes observed evidence; current endpoint health is retained separately.
  const feeds=registry.sources.map(source=>{const rows=records.filter(r=>r.sourceId===source.id),observed=[live,...reports].some(r=>r.feeds.find(f=>f.id===source.id)?.status==='ok');return observed?{id:source.id,stream:source.stream,status:'ok',received:rows.length,accepted:rows.length,rejected:0,duplicates:0,truncated:0}:{id:source.id,stream:source.stream,status:'failed',error:'source_collection_failed'};});
  const report={schemaVersion:1,collectedAt:instant.toISOString(),window,complete:feeds.every(f=>f.status==='ok'),feeds,records};
  // Retained union can exceed a live feed's 50-item cap; select at most 50 newest per publisher.
  report.records=records.filter(r=>records.filter(x=>x.sourceId===r.sourceId).indexOf(r)<50);for(const f of feeds)if(f.status==='ok'){f.truncated=f.accepted-report.records.filter(r=>r.sourceId===f.id).length;f.accepted-=f.truncated;}
  validateRecords(report,instant);return {report,coverage:{...coverage,liveFeeds:live.feeds,liveComplete:live.complete,coverageComplete:!coverage.missing.length&&!coverage.failedReads.length&&!coverage.incomplete.length}};
}
function fairSources(daily,specialist,priorUrls){
  const publisher=s=>s.stream?s.publisher:require('./news-source-policy.cjs').publisherGroup(s);
  const seen=new Set(priorUrls),special=specialist.filter(s=>!seen.has(s.url)),groups=[daily.filter(s=>relevantIndonesia(sourceTextForRelevance(s))),daily.filter(s=>relevantTech(sourceTextForRelevance(s))),...['security','developer'].map(stream=>special.filter(s=>s.stream===stream))];
  // Reserve ten source slots per represented topic, then redistribute unused capacity.
  const chosen=[],used=new Set();for(const limit of [1,5,Infinity])for(let round=0;round<40;round++)for(const group of groups){if(chosen.length>=40)break;const candidate=group.find(s=>!used.has(s.id)&&group.filter(x=>used.has(x.id)&&publisher(x)===publisher(s)).length<limit&&(limit===Infinity||group.filter(x=>used.has(x.id)).length<10));if(candidate){used.add(candidate.id);chosen.push(candidate);}}
  return {daily:chosen.filter(s=>!s.stream),specialist:chosen.filter(s=>s.stream)};
}
function validateSpecialistHistory(value,date,instant){if(!value||Object.keys(value).sort().join(',')!=='editionDate,eventHints,publishedAt,schemaVersion,sources,status'||value.schemaVersion!==1||value.editionDate!==date||value.status!=='published'||!Number.isFinite(Date.parse(value.publishedAt))||Date.parse(value.publishedAt)>instant.getTime()||new Date(Date.parse(value.publishedAt)+7*HOUR).toISOString().slice(0,10)!==date||!Array.isArray(value.sources)||!value.sources.length||value.sources.length>40||!Array.isArray(value.eventHints)||value.eventHints.length>40||value.eventHints.some(t=>typeof t!=='string'||t.length<8||t.length>100||/[\r\n<>]/.test(t)))throw Error('invalid_specialist_history');const urls=new Set();for(const s of value.sources){const policy=registry.sources.find(p=>p.id===s.sourceId);if(!policy||Object.keys(s).sort().join(',')!=='sourceId,url'||require('./specialist-news.cjs').safeUrl(s.url,policy)!==s.url||urls.has(s.url))throw Error('invalid_specialist_history');urls.add(s.url);}return value;}
module.exports={windowFor,validateRecords,withoutSocial,snapshotKey,captureSpecialists,collectDailySpecialists,fairSources,validateSpecialistHistory};
