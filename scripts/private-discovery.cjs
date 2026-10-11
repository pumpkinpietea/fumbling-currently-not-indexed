const fs = require('node:fs');
const path = require('node:path');
const { parse } = require('parse5');
const { SaxesParser } = require('saxes');
const { fetchFeed, publicIpv4 } = require('./feed-transport.cjs');
const { parseRss } = require('./rss-metadata.cjs');
const { relevantNews } = require('./news-relevance.cjs');
const config = require('../config/news-discovery.json');
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
function safeLink(value, base) {
  try {
    if (typeof value !== 'string' || value.length > 2048 || /[\u0000-\u0020]/.test(value)) return null;
    const url = new URL(value, base);
    if (url.protocol !== 'https:' || url.username || url.password || url.port || !url.hostname.includes('.') ||
        url.hostname.endsWith('.local') || url.hostname.endsWith('.internal') || url.hostname.includes(':') ||
        (/^[\d.]+$/.test(url.hostname) && !publicIpv4(url.hostname))) return null;
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_.+|fbclid|gclid)$/i.test(key)) url.searchParams.delete(key);
      else if (/token|auth|email|session|password|unsubscribe/i.test(key)) return null;
    }
    url.hash = ''; return url.href.length <= 2048 ? url.href : null;
  } catch { return null; }
}
function htmlLinks(text, base) {
  const links = [], document = parse(text);
  function content(node) { return node.nodeName === '#text' ? node.value : (node.childNodes || []).map(content).join(' '); }
  function visit(node) {
    if (node.tagName === 'a') {
      const href = node.attrs.find(a => a.name === 'href')?.value, url = safeLink(href, base);
      const title = content(node).replace(/\s+/g,' ').trim().slice(0,500);
      if (url && title && links.length < 200) links.push({url,title});
    }
    for (const child of node.childNodes || []) visit(child);
  }
  visit(document);return links;
}
function sitemapLinks(text, source) {
  const entries = [];let field='', item={};
  const parser = new SaxesParser({xmlns:true});
  parser.on('opentag', node => {field=node.local;if(field==='url')item={};});
  parser.on('text', text => {if(['loc','lastmod'].includes(field))item[field]=(item[field]||'')+text;});
  parser.on('closetag', node => {if(node.local==='url' && entries.length<200) {
    const url=safeLink(item.loc);if(url) entries.push({url,title:decodeURI(new URL(url).pathname).replace(/[-_/]/g,' '), sitemapLastModified:typeof item.lastmod==='string' && item.lastmod.length<=40 ? item.lastmod : null});
  }field='';});
  parser.write(text).close();return entries;
}
function schedule(instant) {
  const local=new Date(instant.getTime()+25200000), day=Math.floor(local.getTime()/86400000);
  const primary=config.sources.filter(s=>!s.weekly), weekly=config.sources.filter(s=>s.weekly);
  const chosen=[primary[day%primary.length],primary[(day+1)%primary.length]];
  if(local.getUTCDay()===1) chosen.push(weekly[Math.floor(day/7)%weekly.length]);
  else chosen.push(primary[(day+2)%primary.length]);
  const watch=config.watchlist[day%config.watchlist.length];
  const url=new URL('https://api.gdeltproject.org/api/v2/doc/doc');
  url.search=new URLSearchParams({query:watch,mode:'ArtList',format:'json',maxrecords:'50',timespan:'2d'}).toString();
  return [...chosen,{id:'gdelt',kind:'gdelt',url:url.href,watch}];
}
function render(report) {
  return '<!doctype html><html lang="ja"><meta charset="utf-8"><title>非公開の収集候補</title><h1>追加のニュース候補</h1><p>原典・公開日時は未確認。公開記事への自動採用は行っていません。</p><ul>'+report.candidates.map(item=>`<li><a href="${escape(item.url)}" target="_blank" rel="noopener noreferrer">${escape(item.title)}</a> · ${escape(item.sourceId)}</li>`).join('')+'</ul></html>';
}
async function discoverPrivate({fetch=fetchFeed,now=()=>new Date(),priorUrls=[]}={}) {
  const instant=now(), seen=new Set(), prior=new Set(priorUrls);
  const report={schemaVersion:1,purpose:'private_link_discovery',collectedAt:instant.toISOString(),dateMeaning:'Discovery/index/sitemap timestamps are not verified original publication dates',sources:[],candidates:[]};
  for(const source of schedule(instant)) {
    try {
      const bytes=await fetch(source.url,{timeoutMs:5000,maxBytes:1048576,contentTypes:['text/html','application/json','application/rss+xml','application/xml','text/xml']});
      const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
      let entries;
      if(source.kind==='html')entries=htmlLinks(text,source.url);
      else if(source.kind==='sitemap')entries=sitemapLinks(text,source);
      else if(source.kind==='rss') {const rss=parseRss(bytes);if(!rss.valid)throw new Error('invalid_feed');entries=rss.records;}
      else {const data=JSON.parse(text);if(!Array.isArray(data.articles)||data.articles.length>50)throw new Error('invalid_index');entries=data.articles.map(a=>({url:a.url,title:a.title,indexSeenAt:typeof a.seendate==='string' && /^[0-9TZ:-]{8,32}$/.test(a.seendate) ? a.seendate : null}));}
      let count=0;
      for(const entry of entries) {
        const url=safeLink(entry.url);if(!url || typeof entry.title!=='string' || entry.title.length>500 || !relevantNews(`${source.context || ''} ${entry.title}`))continue;
        if(source.kind!=='gdelt' && (new URL(url).hostname!==(source.articleHost||new URL(source.url).hostname) || !new RegExp(source.path).test(new URL(url).pathname)))continue;
        if(seen.has(url)||report.candidates.length>=150)continue;
        seen.add(url);count++;
        report.candidates.push({url,title:entry.title,sourceId:source.id,discoveredAt:instant.toISOString(),originalVerified:false,newSincePrevious:!prior.has(url),
          research:source.weekly===true,feedTimestamp:entry.publishedAt||null,indexSeenAt:entry.indexSeenAt||null,sitemapLastModified:entry.sitemapLastModified||null});
      }
      report.sources.push({id:source.id,status:'ok',itemCount:entries.length,candidates:count,watch:source.watch||null});
    }catch {report.sources.push({id:source.id,status:'failed',itemCount:0,candidates:0});}
  }
  let html=render(report);
  while(Buffer.byteLength(html)>900000 || Buffer.byteLength(JSON.stringify(report))>900000){report.candidates.pop();html=render(report);}
  return {report,html};
}
function newsletterText(bytes) {
  if(bytes.length>1048576)throw new Error('intake_size_limit');
  let text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  // Only unencoded UTF-8 messages are supported; no mailbox or URL is accessed.
  if(/content-transfer-encoding:\s*(base64|quoted-printable)|charset\s*=\s*["']?(?!utf-8|us-ascii)[a-z0-9-]+/i.test(text))throw new Error('unsupported_mail_encoding');
  return text;
}
function newsletterCandidates(bytes) {
  const text=newsletterText(bytes), entries=htmlLinks(text), seen=new Set(), result=[];
  for(const value of text.match(/https:\/\/[^\s<>"')]+/g)||[]) {const url=safeLink(value);if(url)entries.push({url,title:new URL(url).hostname});}
  for(const entry of entries) {if(seen.has(entry.url)||result.length>=50)continue;seen.add(entry.url);result.push({...entry,sourceId:'newsletter',originalVerified:false});}
  return result;
}
function readNewsletter(file) {
  const descriptor=fs.openSync(file,'r');
  try {const size=fs.fstatSync(descriptor);if(!size.isFile()||size.size>1048576)throw new Error('intake_size_limit');return fs.readFileSync(descriptor);}finally{fs.closeSync(descriptor);}
}
async function writeReader(directory,reader) {
  const destination=path.resolve(directory), repository=path.resolve(__dirname,'..');
  if(destination===repository || destination.startsWith(repository+path.sep))throw new Error('private_output_outside_repository_required');
  fs.mkdirSync(directory,{mode:0o700});
  fs.writeFileSync(path.join(directory,'report.json'),JSON.stringify(reader.report,null,2),{flag:'wx',mode:0o600});
  fs.writeFileSync(path.join(directory,'index.html'),reader.html,{flag:'wx',mode:0o600});
}
if(require.main===module) (async()=> {
  const args=process.argv.slice(2);let reader,directory;
  if(args.length===3&&args[0]==='--newsletter') {directory=args[2];const report={schemaVersion:1,purpose:'private_newsletter_intake',candidates:newsletterCandidates(readNewsletter(args[1]))};reader={report,html:render(report)};}
  else if(args.length===1) {directory=args[0];reader=await discoverPrivate();}
  else throw new Error('usage');
  await writeReader(directory,reader);console.log(JSON.stringify({status:'saved',sources:reader.report.sources,candidates:reader.report.candidates.length}));
})().catch(()=>{console.log(JSON.stringify({status:'discovery_failed'}));process.exitCode=1;});
module.exports={safeLink,htmlLinks,sitemapLinks,schedule,discoverPrivate,newsletterCandidates,render};
