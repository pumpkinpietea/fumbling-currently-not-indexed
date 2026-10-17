const test=require('node:test'),assert=require('node:assert/strict');
const {dateValue,xmlRecords,pageRecords,evidence,collectSpecialists,collectSocial,socialMatches,registry}=require('../scripts/specialist-news.cjs');
const {validateCandidate,renderSpecialist}=require('../scripts/render-specialist.cjs');
const now=()=>new Date('2026-10-17T12:00:00Z'),window={start:'2026-10-03',end:'2026-10-18'};
const rss=(date='Fri, 16 Oct 2026 12:00:00 GMT')=>Buffer.from(`<rss version="2.0"><channel><item><title>Example security update announcement</title><link>https://www.ncsc.gov.uk/news/example-update</link><pubDate>${date}</pubDate><description>An official example describes a newly announced security update.</description></item></channel></rss>`);
test('specialist dates preserve precision and allow only explicitly reviewed named zones',()=>{
  assert.deepEqual(dateValue('2026-10-14T14:18+09:00'),{value:'2026-10-14T05:18:00.000Z',precision:'minute'});
  assert.equal(dateValue('2026-02-30'),null);assert.equal(dateValue('2026-99-99'),null);assert.equal(dateValue('2026-10-14T25:00:00Z'),null);
  assert.equal(dateValue('Fri, 16 Oct 2026 13:00:00 PDT'),null);
  assert.equal(dateValue('Fri, 16 Oct 2026 13:00:00 PDT',{PDT:'-0700'}).value,'2026-10-16T20:00:00Z');
});
test('namespace-aware Atom/RDF extract exact dates, suppress scripts and reject foreign title fields/DTD',()=>{
  const atom=Buffer.from('<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Example release</title><link href="https://github.com/openai/codex/releases/tag/example"/><published>2026-10-16T12:00:00Z</published><content>&lt;script&gt;bad&lt;/script&gt;Safe release details.</content></entry></feed>');
  assert.equal(xmlRecords(atom)[0].description,'Safe release details.');
  const rdf=Buffer.from('<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns="http://purl.org/rss/1.0/" xmlns:dc="http://purl.org/dc/elements/1.1/"><item><title>Example advisory</title><link>https://www.jpcert.or.jp/at/example.html</link><dc:date>2026-10-14T14:18+09:00</dc:date></item></rdf:RDF>');
  assert.equal(xmlRecords(rdf)[0].dateRaw,'2026-10-14T14:18+09:00');
  assert.throws(()=>xmlRecords(Buffer.from('<!DOCTYPE rss><rss/>')),/doctype/);
  assert.equal(xmlRecords(Buffer.from(atom.toString().replace('<title>','<title xmlns="urn:foreign">')))[0].title,null);
});
test('official dated index adapters preserve date-only values and reject unrelated links',()=>{
  const source=registry.sources.find(s=>s.id==='cncert'),b=Buffer.from('<ul><li>2026-10-09 <a href="/publish/main/10/2026/example.html">官方网络安全风险提示和建议以及相关防范措施通报</a></li><li><a href="https://example.org/">Untrusted</a></li></ul>');
  const records=pageRecords(b,source);assert.equal(records.length,1);assert.equal(evidence(records[0],source).datePrecision,'day');
  assert.equal(evidence({...records[0],url:'https://example.org/publish/main/10/2026/example.html'},source),null);
});
test('specialist collection isolates failures, rejects future records, deduplicates originals and stays bounded',async()=>{
  const sources=registry.sources.filter(s=>['ncsc','jpcert'].includes(s.id));
  const r=await collectSpecialists(window,{now,sources,fetch:async u=>{if(u.includes('jpcert'))throw Error('feed_timeout');return rss();}});
  assert.equal(r.complete,false);assert.equal(r.records.length,1);assert.equal(r.feeds.find(f=>f.id==='jpcert').error,'feed_timeout');
  const f=await collectSpecialists(window,{now,sources:[sources.find(s=>s.id==='ncsc')],fetch:async()=>rss('Sun, 18 Oct 2026 12:00:00 GMT')});assert.equal(f.records.length,0);
});
test('both social streams retain measured signals without author/comment text and cannot inject evidence',async()=>{
  let calls=0;const social=await collectSocial(window,{now,fetch:async()=>{calls++;return Buffer.from(JSON.stringify({hits:[{objectID:'123',title:'Example discussion about a release',url:'https://example.org/original',created_at:'2026-10-16T12:00:00Z',points:42,num_comments:7,author:'private-person',comment_text:'Never retained'}]}));}});
  assert.equal(calls,8);assert.equal(social.modelEvidence,false);assert.deepEqual([...new Set(social.candidates.map(c=>c.stream))].sort(),['developer','security']);assert.equal(JSON.stringify(social).includes('private-person'),false);assert.equal(social.candidates.length,2);
  assert.deepEqual(socialMatches({records:[],social}),[]);
  const failed=await collectSocial(window,{now,fetch:async()=>{throw Error('failure')}});assert.equal(failed.status,'partial');assert.equal(failed.queries.length,8);
});
function fixture(){const source=registry.sources.find(s=>s.id==='ncsc'),s=evidence(xmlRecords(rss())[0],source);return {r:{schemaVersion:1,window,records:[s]},c:{schemaVersion:1,editionDate:'2026-10-17',publishedAt:now().toISOString(),events:[{id:'note-1',stream:'security',sourceIds:[s.id],quotes:[{sourceId:s.id,text:s.title}],en:{title:'Example security update announcement',summary:'The authority announced a security update.'},jp:{title:'公的機関がセキュリティ更新を発表',summary:'公的機関がセキュリティ更新を発表した。'}}],observations:[]},review:{approved:true,checkedIds:[s.id]}};}
test('render gate requires exact reviewed source IDs and rejects tampering/social/uncited trends',()=>{
  const {r,c,review}=fixture();assert.equal(validateCandidate(c,r).counts.security,1);const files=renderSpecialist(c,r,review);assert.equal(Object.keys(files).length,2);assert.match(files['content/jp/article/2026-10-17-world-cybersecurity.md'],/2026-10-03～2026-10-17/);
  assert.throws(()=>renderSpecialist(c,r,{approved:true,checkedIds:[]}),/review_required/);
  assert.throws(()=>validateCandidate({...c,events:[{...c.events[0],sourceIds:['social-id']}]},r),/invalid_specialist_event/);
  assert.throws(()=>validateCandidate(c,{...r,records:[{...r.records[0],excerpt:'Fabricated changed evidence'}]}),/invalid_specialist_evidence/);
  assert.throws(()=>validateCandidate({...c,observations:[{eventIds:['missing'],en:'A general observation.',jp:'確認情報からの観測です。'}]},r),/invalid_cyber_observation/);
});
test('truncation remains canonical through extraction and reconstruction; plain version titles are usable',()=>{
  const source=registry.sources.find(s=>s.id==='codex');const raw={title:'0.163.0',url:'https://github.com/openai/codex/releases/tag/rust-v0.163.0',dateRaw:'2026-10-15T21:30:38Z',dateBasis:'published',description:'New feature information '.repeat(100)};
  const a=evidence(raw,source);assert.ok(a);assert.equal(a.excerpt.endsWith(' '),false);const b=evidence({...raw,description:a.excerpt.slice(a.title.length+1)},source);assert.deepEqual(a,b);
});
test('conflicting dates fail a source rather than silently pick a new date',async()=>{
  const s=registry.sources.find(s=>s.id==='ncsc'),original=rss().toString(),item=original.match(/<item>[\s\S]*<\/item>/)[0].replace('Fri, 16 Oct 2026','Thu, 15 Oct 2026');
  const r=await collectSpecialists(window,{now,sources:[s],fetch:async()=>Buffer.from(original.replace('</channel>',item+'</channel>'))});assert.equal(r.complete,false);assert.equal(r.feeds[0].error,'source_date_conflict');assert.equal(r.records.length,0);
});
test('private social reader escapes markup and marks platform popularity as a sample',()=>{
  const {renderSocialReader}=require('../scripts/specialist-news.cjs');const html=renderSocialReader({social:{collectedAt:'2026-10-17',candidates:[{stream:'developer',title:'<script>unsafe</script>',url:'https://example.org/',points:5,comments:1,discussionUrl:'https://news.ycombinator.com/item?id=123'}]}});assert.ok(!html.includes('<script>'));assert.match(html,/not global popularity/);assert.match(html,/5 points \/ 1 comments/);
});

test('unreviewed source configurations and mismatched edition windows fail before rendering',async()=>{
  await assert.rejects(collectSpecialists(window,{sources:[{...registry.sources[0],url:'https://example.org/'}]}),/invalid_specialist_window/);
  const {c,r}=fixture();assert.throws(()=>validateCandidate(c,{...r,window:{start:'2026-10-02',end:'2026-10-17'}}),/window_mismatch/);
  assert.equal(require('../scripts/specialist-news.cjs').outsideRepository(__filename),false);
});

test('duplicate publication dates cannot silently fall back to Atom updated time',()=>{
 const b=Buffer.from('<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Example source announcement</title><link href="https://github.com/openai/codex/releases/tag/example"/><published>2026-10-15T12:00:00Z</published><published>2026-10-16T12:00:00Z</published><updated>2026-10-17T10:00:00Z</updated></entry></feed>');
 assert.equal(xmlRecords(b)[0].dateRaw,null);
 assert.throws(()=>xmlRecords(Buffer.from(rss().toString().replace('version="2.0"','version="1.0"'))),/invalid_source_xml/);
});
test('licensed institutional summaries retain attribution in directory metadata as well as articles',()=>{
 const {c}=fixture(),policy=registry.sources.find(s=>s.id==='cert-eu'),r0=xmlRecords(rss())[0],source=evidence({...r0,url:'https://cert.europa.eu/publications/security-advisories/example/'},policy),r={schemaVersion:1,window,records:[source]};
 c.events[0].sourceIds=[source.id];c.events[0].quotes=[{sourceId:source.id,text:source.title}];
 const files=renderSpecialist(c,r,{approved:true,checkedIds:[source.id]}),content=files['content/en/article/2026-10-17-world-cybersecurity.md'];
 assert.match(content,/"attributions":\[\{"publisher":"CERT-EU","licenseUrl":"https:\/\/creativecommons.org\/licenses\/by\/4.0\/"/);assert.match(content,/Adapted summary and translation/);
});
