const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {SaxesParser}=require('saxes'),{parse,parseFragment}=require('parse5');
const {fetchFeed}=require('./feed-transport.cjs'),{publicationTime}=require('./rss-metadata.cjs');
const registry=require('../config/specialist-sources.json');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value;
function text(n){return ['script','style','iframe','noscript'].includes(n.tagName)?'':n.nodeName==='#text'?n.value:(n.childNodes||[]).map(text).join(' ');}
const clean=s=>text(parseFragment(String(s||''))).replace(/\s+/g,' ').trim();
function walk(n,fn){fn(n);for(const c of n.childNodes||[])walk(c,fn);}
const hasClass=(n,c)=>(attr(n,'class')||'').split(/\s+/).includes(c);
function dateValue(raw,zones={}){
  if(typeof raw!=='string')return null;
  let value=raw.trim();const zone=/ ([A-Z]{2,4})$/.exec(value)?.[1];if(zone&&zones[zone])value=value.slice(0,-zone.length)+zones[zone];
  if(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/.test(value)){const parsed=dateValue(value.slice(0,16)+':00'+value.slice(16));return parsed?{...parsed,precision:'minute'}:null;}
  if(/^\d{4}-\d{2}-\d{2}$/.test(value)){const d=new Date(value+'T00:00:00Z');return Number.isFinite(d.getTime())&&Number(value.slice(0,4))>=1970&&d.toISOString().slice(0,10)===value?{value,precision:'day'}:null;}
  if(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)){
    if(!dateValue(value.slice(0,10))||!Number.isFinite(Date.parse(value))||Number(value.slice(11,13))>23||Number(value.slice(14,16))>59||Number(value.slice(17,19))>59)return null;
    return {value:new Date(value).toISOString(),precision:'second'};
  }
  const rss=publicationTime(value);return rss?{value:rss,precision:'second'}:null;
}
function safeUrl(value,source){try{const u=new URL(value,source.url);if(u.protocol!=='https:'||u.hostname!==source.articleHost||u.username||u.password||u.port||!new RegExp(source.articlePath).test(u.pathname))return null;
  // Apple publishes stable news identifiers in the official query string.
  if(u.search&&!(source.id==='apple-developer'&&/^\?id=[a-z0-9]+$/.test(u.search)))return null;
  if(u.hash&&source.format!=='deepseek')u.hash='';return u.href;}catch{return null;}}
function xmlRecords(buffer){
  if(!Buffer.isBuffer(buffer)||buffer.length>1024*1024)throw Error('source_size_limit');
  const p=new SaxesParser({xmlns:true}),stack=[];let root,count=0;
  p.on('error',()=>{throw Error('invalid_source_xml')});p.on('doctype',()=>{throw Error('source_doctype_rejected')});
  p.on('opentag',tag=>{if(++count>25000||stack.length>=40)throw Error('source_xml_limit');const n={name:tag.local,uri:tag.uri,attrs:tag.attributes,children:[],text:''};if(stack.length)stack.at(-1).children.push(n);else root=n;stack.push(n)});
  const append=s=>{if(stack.length)stack.at(-1).text+=s;};p.on('text',append);p.on('cdata',append);p.on('closetag',()=>stack.pop());p.write(new TextDecoder('utf8',{fatal:true}).decode(buffer)).close();
  const all=n=>n.text+n.children.map(all).join(' '),field=(n,k)=>{const a=n.children.filter(x=>x.name===k&&(root.name==='RDF'?(k==='date'?x.uri==='http://purl.org/dc/elements/1.1/':x.uri==='http://purl.org/rss/1.0/'):(atom?x.uri==='http://www.w3.org/2005/Atom':!x.uri)));return a.length===1?a[0]:null;};
  let items,atom=false;
  if(root?.name==='rss'&&!root.uri&&root.attrs.version?.value==='2.0'){const c=field(root,'channel');if(!c)throw Error('invalid_source_xml');items=c.children.filter(n=>n.name==='item');}
  else if(root?.name==='RDF'&&root.uri==='http://www.w3.org/1999/02/22-rdf-syntax-ns#')items=root.children.filter(n=>n.name==='item'&&n.uri==='http://purl.org/rss/1.0/');
  else if(root?.name==='feed'&&root.uri==='http://www.w3.org/2005/Atom'){atom=true;items=root.children.filter(n=>n.name==='entry'&&n.uri===root.uri);}
  else throw Error('invalid_source_xml');
  if(items.length>200)throw Error('source_record_limit');
  return items.map(n=>{const title=field(n,'title'),description=field(n,atom?'content':'description')||field(n,'summary');const published=field(n,atom?'published':root.name==='RDF'?'date':'pubDate'),updated=atom?field(n,'updated'):null;
    const link=atom?n.children.filter(x=>x.name==='link'&&x.uri==='http://www.w3.org/2005/Atom'&&(!x.attrs.rel||x.attrs.rel.value==='alternate')&&x.attrs.href).map(x=>x.attrs.href.value):[field(n,'link')].filter(Boolean).map(all);
    return {title:title?clean(all(title)):null,url:link.length===1?link[0]:null,dateRaw:n.children.filter(c=>c.name===(atom?'published':root.name==='RDF'?'date':'pubDate')&&c.uri===(atom?'http://www.w3.org/2005/Atom':root.name==='RDF'?'http://purl.org/dc/elements/1.1/':'')).length>1?null:published?all(published).trim():updated?all(updated).trim():null,dateBasis:published?'published':'updated',description:description?clean(all(description)):''};});
}
function githubRecords(buffer){const j=JSON.parse(buffer);if(j.draft!==false||j.prerelease!==false||typeof j.name!=='string'||typeof j.body!=='string')throw Error('invalid_release');return [{title:j.name,url:j.html_url,dateRaw:j.published_at,dateBasis:'published',description:j.body}];}
function pageRecords(buffer,source){
  const doc=parse(new TextDecoder('utf8',{fatal:true}).decode(buffer)),records=[];
  if(source.format==='deepseek'){
    let article;walk(doc,n=>{if(n.tagName==='article')article=n});if(!article)throw Error('source_structure_changed');
    let date,heading;walk(article,n=>{if(n.tagName==='h2'){date=/^Date: (\d{4}-\d{2}-\d{2})/.exec(text(n).trim())?.[1];heading=null;}
      if(n.tagName==='h3'&&date)heading={title:text(n).replace(/\u200b/g,'').trim(),anchor:attr(n,'id'),date};
      if(n.tagName==='p'&&heading){records.push({title:heading.title,url:source.url+'#'+heading.anchor,dateRaw:heading.date,dateBasis:'published',description:text(n).trim()});heading=null;}});
  }else if(source.format==='google')walk(doc,n=>{if(!hasClass(n,'post-item'))return;let link,title,description,date;walk(n,c=>{if(c.tagName==='a'&&hasClass(c,'post-item__link'))link=attr(c,'href');if(c.tagName==='span')title=text(c);if(c.tagName==='p')description=text(c);if(hasClass(c,'post-item__top'))date=text(c).trim();});
    const m=/^([A-Z]+)\.? (\d{1,2}), (\d{4})$/.exec(date||''),months=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];if(m&&months.includes(m[1]))records.push({title,url:link,description,dateRaw:`${m[3]}-${String(months.indexOf(m[1])+1).padStart(2,'0')}-${m[2].padStart(2,'0')}`,dateBasis:'published'});
  });
  else walk(doc,n=>{if(n.tagName!=='a')return;const url=safeUrl(attr(n,'href'),source);if(!url)return;const title=text(n).trim();let context=n.parentNode,date;
    for(let level=0;level<3&&context;level++,context=context.parentNode){const s=text(context).replace(/\s+/g,' ');if(s.length>1600)break;
      if(source.format==='cncert')date=/\b\d{4}-\d{2}-\d{2}\b/.exec(s)?.[0];
      else {const m=/\b([A-Z][a-z]{2}) (\d{2}), (\d{4})\b/.exec(s),months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];if(m&&months.includes(m[1]))date=`${m[3]}-${String(months.indexOf(m[1])+1).padStart(2,'0')}-${m[2]}`;}
      if(date)break;}
    if(date)records.push({title,url,dateRaw:date,dateBasis:'published',description:''});
  });
  if(!records.length)throw Error('source_structure_changed');return records;
}
function evidence(record,source){
  const title=clean(record.title),date=dateValue(record.dateRaw,source.dateZones),url=safeUrl(record.url,source);if(!date||!url||title.length<3||title.length>500)return null;
  const description=source.evidence==='title'?'':clean(record.description).slice(0,1600).trimEnd(),excerpt=title+(description?'\n'+description:'');
  if(excerpt.length<20)return null;
  return {id:hash(source.id+'\n'+url).slice(0,16),sourceId:source.id,stream:source.stream,publisher:source.name,publisherCountry:source.country,type:source.type,url,title,dateRaw:record.dateRaw,dateBasis:source.id==='jpcert'?'distributed':record.dateBasis,publishedAt:date.value,datePrecision:date.precision,evidenceType:description?'official_excerpt':'official_title',excerpt,excerptHash:hash(excerpt),...(source.license?{license:source.license}:{})};
}
function validWindow(window){return window&&dateValue(window.start)?.precision==='day'&&dateValue(window.end)?.precision==='day'&&window.start<window.end&&Date.parse(window.end)-Date.parse(window.start)<=31*86400000;}
async function collectSpecialists(window,{fetch=fetchFeed,now=()=>new Date(),sources=registry.sources}={}){
  if(!validWindow(window)||!Array.isArray(sources)||!sources.length||sources.length>16||new Set(sources.map(s=>s.id)).size!==sources.length||sources.some(s=>!registry.sources.includes(s)))throw Error('invalid_specialist_window');
  const report={schemaVersion:1,collectedAt:now().toISOString(),window,complete:true,feeds:[],records:[],social:{status:'not_requested',modelEvidence:false,queries:[],candidates:[]}};
  const results=await (async()=>{const out=[];for(let i=0;i<sources.length;i+=4)out.push(...await Promise.all(sources.slice(i,i+4).map(async s=>{try{const b=await fetch(s.url,{timeoutMs:10000,maxBytes:1024*1024,contentTypes:s.format==='github'?['application/json']:s.format==='xml'?['application/rss+xml','application/atom+xml','application/rdf+xml','application/xml','text/xml']:['text/html']});const raw=s.format==='xml'?xmlRecords(b):s.format==='github'?githubRecords(b):pageRecords(b,s),seen=new Map();let rejected=0;for(const r of raw){const e=evidence(r,s);if(!e||e.publishedAt.slice(0,10)<window.start||e.publishedAt.slice(0,10)>=window.end||Date.parse(e.publishedAt)>now().getTime()){rejected++;continue;}const old=seen.get(e.url);if(old&&old.publishedAt!==e.publishedAt)throw Error('source_date_conflict');if(!old)seen.set(e.url,e);}return {feed:{id:s.id,stream:s.stream,status:'ok',received:raw.length,accepted:Math.min(seen.size,50),rejected,duplicates:raw.length-rejected-seen.size,truncated:Math.max(0,seen.size-50)},records:[...seen.values()].sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)).slice(0,50)};}catch(e){return {feed:{id:s.id,stream:s.stream,status:'failed',error:['feed_timeout','feed_size_limit','feed_response_rejected','source_structure_changed','source_date_conflict'].includes(e.message)?e.message:'source_collection_failed'},records:[]};}})));return out;})();
  for(const r of results){report.feeds.push(r.feed);report.records.push(...r.records);if(r.feed.status==='failed')report.complete=false;}
  if(report.records.length>500)throw Error('specialist_record_limit');return report;
}
const safeExternal=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&u.href.length<=2000?u.href:null;}catch{return null;}};
async function collectSocial(window,{fetch=fetchFeed,now=()=>new Date()}={}){
  if(!validWindow(window))throw Error('invalid_specialist_window');const out={status:'complete',modelEvidence:false,platform:'Hacker News / Algolia',collectedAt:now().toISOString(),queries:[],candidates:[]},seen=new Set();
  for(const {stream,query}of registry.socialQueries){const u=new URL('https://hn.algolia.com/api/v1/search');u.searchParams.set('query',query);u.searchParams.set('tags','story');u.searchParams.set('hitsPerPage','20');u.searchParams.set('numericFilters',`created_at_i>=${Date.parse(window.start)/1000},created_at_i<${Math.min(Date.parse(window.end),now().getTime())/1000}`);
    try{const b=await fetch(u.href,{timeoutMs:10000,maxBytes:256*1024,contentTypes:['application/json']}),j=JSON.parse(b);if(!Array.isArray(j.hits)||j.hits.length>20)throw Error();let kept=0;
      for(const h of j.hits){const url=safeExternal(h.url),created=dateValue(h.created_at);if(!url||!created||created.value.slice(0,10)<window.start||created.value.slice(0,10)>=window.end||Date.parse(created.value)>now().getTime()||!/^\d{1,12}$/.test(h.objectID)||![h.points,h.num_comments].every(n=>Number.isInteger(n)&&n>=0)||typeof h.title!=='string'||h.title.length>500)continue;
        const key=stream+':'+h.objectID;if(seen.has(key))continue;seen.add(key);kept++;out.candidates.push({stream,title:clean(h.title),url,discussionUrl:`https://news.ycombinator.com/item?id=${h.objectID}`,publishedAt:created.value,points:h.points,comments:h.num_comments,query});}
      out.queries.push({stream,query,status:'ok',received:j.hits.length,retained:kept});
    }catch{out.status='partial';out.queries.push({stream,query,status:'failed',error:'social_query_failed'});}}
  out.candidates.sort((a,b)=>b.points-a.points||b.comments-a.comments);return out;
}
function socialMatches(report){return report.records.flatMap(source=>{const matches=report.social.candidates.filter(c=>c.stream===source.stream&&c.url.replace(/#.*$/,'')===source.url.replace(/#.*$/,''));return matches.length?[{sourceId:source.id,discussions:matches.map(({discussionUrl,points,comments})=>({discussionUrl,points,comments}))}]:[];});}
function outsideRepository(destination){const root=path.resolve(__dirname,'..'),target=path.resolve(destination);return target!==root&&!target.startsWith(root+path.sep);}
function renderSocialReader(report){
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Private specialist discovery</title><body><h1>Private specialist discovery</h1><p>Hacker News query sample, observed '+esc(report.social.collectedAt)+'. Points and comments are platform measurements, not global popularity. Discovery only; not public/model evidence.</p>'+['security','developer'].map(stream=>'<h2>'+esc(stream)+'</h2><ol>'+report.social.candidates.filter(c=>c.stream===stream).map(c=>'<li><a target="_blank" rel="noopener noreferrer" href="'+esc(c.url)+'">'+esc(c.title)+'</a> — '+c.points+' points / '+c.comments+' comments · <a target="_blank" rel="noopener noreferrer" href="'+esc(c.discussionUrl)+'">discussion</a></li>').join('')+'</ol>').join('')+'</body></html>';
}
async function main(){const [date,destination,...flags]=process.argv.slice(2);if(dateValue(date)?.precision!=='day'||!destination||flags.some(f=>f!=='--social'))throw Error('usage_date_new_output_optional_social');const end=new Date(Date.parse(date)+86400000).toISOString().slice(0,10),start=new Date(Date.parse(end)-14*86400000).toISOString().slice(0,10);if(Date.parse(date)>Date.now())throw Error('future_edition');if(!outsideRepository(destination))throw Error('private_output_outside_repository_required');if(fs.existsSync(destination)||(flags.includes('--social')&&fs.existsSync(destination+'.social.html')))throw Error('output_exists');const report=await collectSpecialists({start,end});if(flags.includes('--social')){report.social=await collectSocial(report.window);report.social.matchedOriginals=socialMatches(report);}const payload=JSON.stringify(report,null,2);if(Buffer.byteLength(payload)>2*1024*1024)throw Error('report_size_limit');fs.writeFileSync(destination,payload,{flag:'wx',mode:0o600});if(flags.includes('--social'))fs.writeFileSync(destination+'.social.html',renderSocialReader(report),{flag:'wx',mode:0o600});console.log(JSON.stringify({status:report.complete?'collected':'partial',records:report.records.length,feeds:report.feeds,socialQueries:report.social.queries,socialCandidates:report.social.candidates.length}));}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1});
module.exports={dateValue,safeUrl,xmlRecords,pageRecords,evidence,validWindow,collectSpecialists,collectSocial,socialMatches,renderSocialReader,outsideRepository,registry,hash,clean};
