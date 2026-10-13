const { SaxesParser } = require('saxes');
const { parseRss } = require('./rss-metadata.cjs');
const { fetchFeed } = require('./feed-transport.cjs');
const { safeLink, newsletterCandidates } = require('./private-discovery.cjs');
function originalLink(value) {
  try {
    let url = new URL(value);
    if (['www.google.com', 'google.com'].includes(url.hostname) && url.pathname === '/url') {
      const target = url.searchParams.get('url') || url.searchParams.get('q');
      if (!target) return null;url = new URL(target);
    }
    if (['www.google.com', 'google.com', 'news.google.com'].includes(url.hostname) ||
        /(?:^|\/)(?:unsubscribe|login|signin|oauth|password|reset|account|preferences)(?:\/|$)/i.test(url.pathname)) return null;
    return safeLink(require('./collect-feeds.cjs').normalizeRecord({url:url.href},{stripRssSource:true}).url);
  } catch { return null; }
}
function validConfig(value) {
  return value && Object.keys(value).sort().join(',') === 'feeds,schemaVersion' && value.schemaVersion === 1 &&
    Array.isArray(value.feeds) && value.feeds.length <= 3 && new Set(value.feeds).size === value.feeds.length &&
    value.feeds.every(value => { try { const url = new URL(value);return value.length <= 400 &&
      url.protocol === 'https:' && url.hostname === 'www.google.com' && !url.port && !url.username && !url.password &&
      !url.search && !url.hash && /^\/alerts\/feeds\/[A-Za-z0-9_-]{1,128}\/[A-Za-z0-9_-]{1,128}$/.test(url.pathname);
    } catch { return false; } });
}
function parseAlerts(bytes) {
  if (bytes.length > 1048576) throw new Error('alert_size_limit');
  const rss = parseRss(bytes);
  if (rss.valid) return rss.records.map(r => ({title:r.title,url:originalLink(r.url),feedTimestamp:r.publishedAt})).filter(r=>r.url);
  const text = new TextDecoder('utf-8',{fatal:true}).decode(bytes), records=[];
  const parser = new SaxesParser({xmlns:true});let nodes=0,depth=0,entries=0,entry,field,root=false;
  parser.on('error',()=>{throw new Error('invalid_alert_feed');});
  parser.on('doctype',()=>{throw new Error('invalid_alert_feed');});
  parser.on('opentag',tag=>{
    if(++nodes>10000 || ++depth>32)throw new Error('invalid_alert_feed');
    if(depth===1){if(tag.local!=='feed'||tag.uri!=='http://www.w3.org/2005/Atom')throw new Error('invalid_alert_feed');root=true;}
    if(tag.uri!=='http://www.w3.org/2005/Atom')return;
    if(depth===2&&tag.local==='entry'){if(++entries>200)throw new Error('alert_item_limit');entry={title:'',url:null,feedTimestamp:null};}
    if(entry&&depth===3&&['title','published','updated'].includes(tag.local))field={name:tag.local,text:''};
    if(entry&&depth===3&&tag.local==='link'){
      const a=tag.attributes,rel=a.rel?.value;if(!rel||rel==='alternate'){
        if(entry.url)throw new Error('ambiguous_alert_link');entry.url=originalLink(a.href?.value);
      }
    }
  });
  const append=value=>{if(field){field.text+=value;if(field.text.length>1000)throw new Error('alert_field_limit');}};
  parser.on('text',append);parser.on('cdata',append);
  parser.on('closetag',tag=>{
    if(field&&depth===3&&tag.local===field.name){
      if(field.name==='title')entry.title=field.text.trim();else if(!entry.feedTimestamp&&Number.isFinite(Date.parse(field.text)))entry.feedTimestamp=field.text;
      field=null;
    }
    if(entry&&depth===2&&tag.local==='entry'){if(entry.url&&entry.title)records.push(entry);entry=null;}
    depth--;
  });
  parser.write(text).close();if(!root)throw new Error('invalid_alert_feed');return records;
}
async function readAlerts(config, { fetch=fetchFeed }={}) {
  const report={schemaVersion:1,purpose:'private_alert_candidates',configured:!!(validConfig(config) && config.feeds.length),feeds:[],candidates:[]};
  if(!config)return report;
  if(!validConfig(config)){report.configurationInvalid=true;return report;}
  for(const [index,url] of config.feeds.entries()){
    try{
      const records=parseAlerts(await fetch(url,{timeoutMs:5000,contentTypes:['application/atom+xml','application/rss+xml','application/xml','text/xml']}));
      report.feeds.push({id:`alert-${index+1}`,status:'ok',itemCount:records.length});
      for(const record of records)if(report.candidates.length<150)report.candidates.push({...record,sourceId:`alert-${index+1}`,originalVerified:false});
    }catch{report.feeds.push({id:`alert-${index+1}`,status:'failed',itemCount:0});}
  }
  return report;
}
function reconcileCandidates(candidates, records, accepted) {
  const allowed=new Set(accepted.map(r=>r.normalizedUrl)), eligible=records.filter(r=>allowed.has(r.url));
  const normalize=value=>String(value||'').normalize('NFKC').replace(/<[^>]*>/g,' ').replace(/(?:\s+-\s+[^-]+|[（(][^()（）]+[)）])$/,'').replace(/\s+/g,'').toLowerCase();
  const urls=new Set(eligible.map(r=>r.url)),titles=new Map();
  for(const record of eligible){const title=normalize(record.title);if(title.length<12)continue;const matches=titles.get(title)||new Set();matches.add(record.url);titles.set(title,matches);}
  const preferred=new Set();let direct=0,hints=0,unmatched=0;
  for(const candidate of candidates||[]){
    const link=originalLink(candidate.url);
    if(link&&urls.has(link)){preferred.add(link);direct++;continue;}
    const matches=titles.get(normalize(candidate.title));
    if(matches?.size===1){preferred.add([...matches][0]);hints++;}else unmatched++;
  }
  return {preferredUrls:[...preferred],directMatches:direct,uniqueTitleHints:hints,unmatched,identityVerified:false};
}
module.exports={originalLink,validConfig,parseAlerts,readAlerts,reconcileCandidates};
if(require.main===module)(async()=>{
  const fs=require('node:fs'),path=require('node:path'),args=process.argv.slice(2);
  if(args.length===2&&args[0]==='--configure'){
    const stat=fs.lstatSync(args[1]);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>4096)throw new Error();
    const config=JSON.parse(fs.readFileSync(args[1],'utf8'));if(!validConfig(config))throw new Error();
    const token=require('node:child_process').execFileSync('gcloud',['auth','print-access-token'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
    const state=require('./news-state.cjs').cloudState(token),prior=await state.read('auth/alerts.json');
    await state.write('auth/alerts.json',config,prior?.generation||'0');console.log(JSON.stringify({status:'configured',feeds:config.feeds.length}));return;
  }
  if(args.length!==3||!['--email','--feed-file'].includes(args[0]))throw new Error();
  const descriptor=fs.openSync(args[1],'r');let bytes;
  try{const stat=fs.fstatSync(descriptor);if(!stat.isFile()||stat.size>1048576)throw new Error();bytes=fs.readFileSync(descriptor);}finally{fs.closeSync(descriptor);}
  const candidates=args[0]==='--email'?newsletterCandidates(bytes).map(c=>({...c,url:originalLink(c.url)})).filter(c=>c.url):parseAlerts(bytes);
  const destination=path.resolve(args[2]),repository=path.resolve(__dirname,'..');if(destination===repository||destination.startsWith(repository+path.sep))throw new Error();
  fs.mkdirSync(destination,{mode:0o700});fs.writeFileSync(path.join(destination,'candidates.json'),JSON.stringify({schemaVersion:1,candidates},null,2),{flag:'wx',mode:0o600});
  console.log(JSON.stringify({status:'saved',candidates:candidates.length}));
})().catch(()=>{console.log(JSON.stringify({status:'alert_intake_failed'}));process.exitCode=1;});
