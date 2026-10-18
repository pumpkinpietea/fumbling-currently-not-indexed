const fs=require('node:fs'),path=require('node:path');
const {registry,dateValue,validWindow,evidence,hash,outsideRepository}=require('./specialist-news.cjs');
const {numericFacts}=require('./news-numbers.cjs');
const plain=(s,max)=>typeof s==='string'&&s.length>=8&&s.length<=max&&!/[\r\n<>\[\]{}\\`]/.test(s)&&!/https?:|www\./i.test(s);
const numbers=s=>JSON.stringify(numericFacts(s));
function validateCandidate(candidate,report,{previousDay=false}={}){
  if(report?.schemaVersion!==1||!validWindow(report.window)||!Array.isArray(report.records)||report.records.length>500||
    candidate?.schemaVersion!==1||dateValue(candidate.editionDate)?.precision!=='day'||dateValue(candidate.publishedAt)?.precision!=='second'||candidate.publishedAt.slice(0,10)!==candidate.editionDate||
    !Array.isArray(candidate.events)||!candidate.events.length||candidate.events.length>40||!Array.isArray(candidate.observations)||candidate.observations.length>3)throw Error('invalid_specialist_candidate');
  if(report.window.end!==(previousDay?candidate.editionDate:new Date(Date.parse(candidate.editionDate)+86400000).toISOString().slice(0,10)))throw Error('specialist_edition_window_mismatch');
  const ids=new Set(),urls=new Set();for(const source of report.records){const policy=registry.sources.find(s=>s.id===source.sourceId);if(!policy||!['published','updated','distributed'].includes(source.dateBasis))throw Error('unreviewed_specialist_source');
    const desc=source.excerpt?.startsWith(source.title+'\n')?source.excerpt.slice(source.title.length+1):'';
    const reconstructed=evidence({title:source.title,url:source.url,dateRaw:source.dateRaw,dateBasis:source.dateBasis,description:desc},policy);
    if(!reconstructed||Object.keys(reconstructed).some(k=>JSON.stringify(source[k])!==JSON.stringify(reconstructed[k]))||source.excerptHash!==hash(source.excerpt)||ids.has(source.id)||urls.has(source.url)||source.publishedAt.slice(0,10)<report.window.start||source.publishedAt.slice(0,10)>=report.window.end||Date.parse(source.publishedAt)>Date.parse(candidate.publishedAt))throw Error('invalid_specialist_evidence');
    ids.add(source.id);urls.add(source.url);}
  const used=new Set(),eventIds=new Set(),counts={security:0,developer:0};
  for(const event of candidate.events){
    if(!['security','developer'].includes(event.stream)||!/^note-[1-9]\d?$/.test(event.id)||eventIds.has(event.id)||!Array.isArray(event.sourceIds)||!event.sourceIds.length||event.sourceIds.length>3||event.sourceIds.some(id=>!ids.has(id)||used.has(id)||report.records.find(s=>s.id===id).stream!==event.stream)||new Set(event.sourceIds).size!==event.sourceIds.length||!Array.isArray(event.quotes)||event.quotes.length!==event.sourceIds.length||new Set(event.quotes.map(q=>q.sourceId)).size!==event.sourceIds.length)throw Error('invalid_specialist_event');
    eventIds.add(event.id);event.sourceIds.forEach(id=>used.add(id));if(++counts[event.stream]>20)throw Error('specialist_topic_limit');
    for(const l of ['en','jp'])if(!plain(event[l]?.title,100)||!plain(event[l]?.summary,l==='jp'?180:400))throw Error('invalid_specialist_text');
    const a=event.en.title+' '+event.en.summary,b=event.jp.title+' '+event.jp.summary;if(numbers(a)!==numbers(b))throw Error('specialist_translation_numbers');
    const available=event.sourceIds.flatMap(id=>numericFacts(report.records.find(s=>s.id===id).excerpt));if(numericFacts(a).some(n=>!available.includes(n)))throw Error('specialist_unsupported_number');
    for(const q of event.quotes)if(!event.sourceIds.includes(q.sourceId)||typeof q.text!=='string'||q.text.length<20||q.text.length>250||!report.records.find(s=>s.id===q.sourceId).excerpt.includes(q.text))throw Error('specialist_unsupported_quote');
  }
  for(const observation of candidate.observations){if(!Array.isArray(observation.eventIds)||!observation.eventIds.length||observation.eventIds.length>6||new Set(observation.eventIds).size!==observation.eventIds.length||observation.eventIds.some(id=>!candidate.events.some(e=>e.id===id&&e.stream==='security'))||!plain(observation.en,500)||!plain(observation.jp,200)||numbers(observation.en)!==numbers(observation.jp))throw Error('invalid_cyber_observation');
    const available=observation.eventIds.flatMap(id=>numericFacts(candidate.events.find(e=>e.id===id).en.title+' '+candidate.events.find(e=>e.id===id).en.summary));if(numericFacts(observation.en).some(n=>!available.includes(n)))throw Error('unsupported_observation_number');}
  return {counts,usedIds:[...used]};
}
function renderSpecialist(candidate,report,review,options={}){
  const {usedIds}=validateCandidate(candidate,report,options);
  if(review?.approved!==true||!Array.isArray(review.checkedIds)||JSON.stringify([...review.checkedIds].sort())!==JSON.stringify([...usedIds].sort()))throw Error('specialist_review_required');
  const files={};for(const stream of ['security','developer']){const events=candidate.events.filter(e=>e.stream===stream);if(!events.length)continue;
    const slug=stream==='security'?'world-cybersecurity':'developer-tools';
    for(const l of ['en','jp']){const jp=l==='jp',title=stream==='security'?(jp?'世界のサイバーセキュリティ動向':'Worldwide Cybersecurity Digest'):(jp?'開発ツール・AI開発ブログ':'Developer Tools and AI Engineering Digest');
      const metadata=events.map(e=>({title:e[l].title,summary:e[l].summary,countries:[],topics:[stream==='security'?'security':'developer-tools'],sourceUrls:e.sourceIds.map(id=>report.records.find(s=>s.id===id).url),attributions:e.sourceIds.flatMap(id=>{const s=report.records.find(s=>s.id===id);return s.license?[{publisher:s.publisher,licenseUrl:s.license,licenseLabel:'CC BY 4.0'}]:[];})}));
      const lines=['---',`title: ${JSON.stringify(title+' — '+candidate.editionDate)}`,`date: ${candidate.publishedAt}`,`lastmod: ${candidate.publishedAt}`,`slug: ${slug}-${candidate.editionDate}`,`translationKey: ${slug}-${candidate.editionDate}`,'draft: false','showToc: false',`newsEdition: ${stream}`,`newsItems: ${JSON.stringify(metadata)}`,'---',''];
      const last=new Date(Date.parse(report.window.end)-86400000).toISOString().slice(0,10);lines.push(jp?`対象期間：${report.window.start}～${last}。出典の公開・更新日を各項目に記載。`:`Source window: ${report.window.start}–${last}. Publication or update dates are shown with each source.`,'');
      lines.push(jp?'## 今回のハイライト':"## Highlights",'');events.slice(0,3).forEach((e,i)=>lines.push(`- [${e[l].title}](#news-${i+1})`,''));
      if(stream==='security'&&candidate.observations.length){lines.push(jp?'## 世界の動向：確認できた情報から':'## World developments in the reviewed evidence','');for(const o of candidate.observations){const links=o.eventIds.map(id=>{const i=events.findIndex(e=>e.id===id);return `[${events[i][l].title}](#news-${i+1})`;});lines.push(o[l],'',links.join(' · '),'');}}
      for(const [i,e]of events.entries()){lines.push(`## ${e[l].title} {#news-${i+1}}`,'',e[l].summary,'');for(const id of e.sourceIds){const s=report.records.find(s=>s.id===id),basis=s.dateBasis==='distributed'?(jp?'RSS更新':'RSS update'):s.dateBasis==='updated'?(jp?'更新':'Updated'):(jp?'公開':'Published');const when=s.datePrecision==='day'?s.publishedAt:s.datePrecision==='minute'?s.publishedAt.slice(0,16).replace('T',' ')+' UTC':s.publishedAt.replace('T',' ').replace(/\.000Z$|Z$/,' UTC');lines.push(`[${jp?'出典':'Source'}: ${s.publisher} · ${basis} ${when}](${s.url})`,'');if(s.license)lines.push(`[CC BY 4.0](${s.license}) · ${jp?'出典を基に要約・翻訳':'Adapted summary and translation'}`,'');}}
      files[`content/${l}/article/${candidate.editionDate}-${slug}.md`]=lines.join('\n');}}
  return files;
}
function main(){const [candidatePath,reportPath,reviewPath,destination]=process.argv.slice(2);if(!destination)throw Error('usage_candidate_report_review_new_staging_directory');if(!outsideRepository(destination))throw Error('private_output_outside_repository_required');const c=JSON.parse(fs.readFileSync(candidatePath)),r=JSON.parse(fs.readFileSync(reportPath)),review=JSON.parse(fs.readFileSync(reviewPath)),files=renderSpecialist(c,r,review);fs.mkdirSync(destination,{mode:0o700});for(const [name,value]of Object.entries(files)){const target=path.join(destination,name);fs.mkdirSync(path.dirname(target),{recursive:true,mode:0o700});fs.writeFileSync(target,value,{flag:'wx',mode:0o600});}console.log(JSON.stringify({status:'rendered',files:Object.keys(files)}));}
if(require.main===module)try{main()}catch(e){console.error(e.message);process.exitCode=1;}
module.exports={validateCandidate,renderSpecialist};
