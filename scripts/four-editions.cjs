const {validateRecords,windowFor}=require('./specialist-runtime.cjs');
const {renderSpecialist}=require('./render-specialist.cjs');
const {dateValue}=require('./specialist-news.cjs');
function allEvents(bundle){return [...bundle.events,...bundle.specialist.candidate.events];}
function allSources(bundle){return [...bundle.sources,...bundle.specialist.report.records];}
function subsetReport(report,records){return {...report,records,feeds:report.feeds.map(f=>f.status==='failed'?f:{id:f.id,stream:f.stream,status:'ok',received:records.filter(r=>r.sourceId===f.id).length,accepted:records.filter(r=>r.sourceId===f.id).length,rejected:0,duplicates:0,truncated:0})};}
function validateFour(bundle,date,{reconstruct=true}={}){
  if(bundle?.schemaVersion!==6||bundle.editionDate!==date||!Array.isArray(bundle.events)||!Array.isArray(bundle.sources)||!bundle.specialist?.candidate||!bundle.specialist.report||!bundle.review||bundle.review.approved!==true||!Array.isArray(bundle.review.checkedIds))throw Error('invalid_publication_bundle');
  const {candidate,report}=bundle.specialist;
  if(candidate.editionDate!==date||candidate.schemaVersion!==1||dateValue(candidate.publishedAt)?.precision!=='second'||candidate.publishedAt.slice(0,10)!==date||JSON.stringify(report.window)!==JSON.stringify(windowFor(date))||!Array.isArray(candidate.events)||!Array.isArray(candidate.observations)||candidate.observations.length>3)throw Error('invalid_publication_bundle');
  validateRecords(report,new Date(candidate.publishedAt));
  const events=allEvents(bundle),sources=allSources(bundle),ids=events.flatMap(e=>e.sourceIds||[]);
  if(events.length>40||sources.length>40||new Set(sources.map(s=>s.id)).size!==sources.length||new Set(sources.map(s=>s.url)).size!==sources.length||new Set(ids).size!==ids.length||JSON.stringify([...ids].sort())!==JSON.stringify([...bundle.review.checkedIds].sort()))throw Error('invalid_publication_bundle');
  if(!candidate.events.length&&candidate.observations.length)throw Error('invalid_cyber_observation');
  const dailyReview={...bundle.review,checkedIds:bundle.events.flatMap(e=>e.sourceIds)};
  const {renderDailyEditions,validateBundle}=require('./daily-news.cjs');
  const dailyFiles=renderDailyEditions(date,bundle.events,bundle.sources);
  validateBundle({schemaVersion:5,editionDate:date,revision:bundle.revision,sources:bundle.sources,events:bundle.events,review:dailyReview,files:dailyFiles},date);
  const specialistFiles=candidate.events.length?renderSpecialist(candidate,report,{...bundle.review,checkedIds:candidate.events.flatMap(e=>e.sourceIds)},{previousDay:true}):{};
  const files={...dailyFiles,...specialistFiles};
  if(reconstruct&&JSON.stringify(bundle.files)!==JSON.stringify(files))throw Error('bundle_files_mismatch');
  return files;
}
function makeFour({date,revision,sources,events,report,specialistEvents,observations,publishedAt,review}){
  const bundle={schemaVersion:6,editionDate:date,revision,sources,events,specialist:{candidate:{schemaVersion:1,editionDate:date,publishedAt,events:specialistEvents,observations},report},review};
  bundle.files=validateFour(bundle,date,{reconstruct:false});return bundle;
}
module.exports={allEvents,allSources,subsetReport,validateFour,makeFour};
