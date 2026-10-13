const {test}=require('node:test'),assert=require('node:assert/strict');
const {normalizeRecord,collectFeeds}=require('../scripts/collect-feeds.cjs');
const {dailyFeeds,sourceProvider}=require('../scripts/news-source-policy.cjs');
const {extractRssEvidence}=require('../scripts/news-evidence.cjs');
const {renderDailyEditions,validateBundle,shortlist}=require('../scripts/daily-news.cjs');
const {originalLink,validConfig,parseAlerts,readAlerts,reconcileCandidates}=require('../scripts/alert-intake.cjs');
const url='https://news.yahoo.co.jp/articles/'+'a'.repeat(40);
const record={feedId:'yahoo-world',url,title:'インドネシア政府、新たな災害対策に関する計画を発表(共同通信)',publishedAt:'2026-10-12T04:00:00Z',description:'インドネシア政府は災害対策の新たな計画を発表した。今後の対応について説明し、関係する機関との協力を進めるとしている。'};
test('Yahoo tracking normalization is restricted to its exact official RSS marker',()=>{
 assert.equal(normalizeRecord({...record,url:url+'?source=rss'},{stripRssSource:true}).url,url);
 for(const link of [url+'?source=other',url+'?source=rss&token=private','https://example.com/articles/a?source=rss'])assert.equal(normalizeRecord({url:link},{stripRssSource:true}).url,link);
 assert.equal(normalizeRecord({url:url+'?source=rss'},{}).url,url+'?source=rss');
});
test('Yahoo evidence requires credited provider and renders explicit distribution attribution',()=>{
 const source=extractRssEvidence(record),event={sourceIds:[source.id],en:{title:'Indonesia announces disaster planning',summary:'Indonesia announced a disaster planning initiative.'},jp:{title:'インドネシア、災害対策の計画を発表',summary:'インドネシア政府は災害対策の新たな計画を発表した。'},quotes:[{sourceId:source.id,text:record.description}]};
 const files=renderDailyEditions('2026-10-13',[event],[source]);assert.equal(Object.keys(files).length,2);
 assert.ok(files['content/jp/article/2026-10-13-indonesia-news.md'].includes('Yahoo!ニュース / 共同通信'));
 const bundle={schemaVersion:3,editionDate:'2026-10-13',revision:'a'.repeat(40),sources:[source],events:[event],review:{approved:true,checkedIds:[source.id]},files};
 assert.deepEqual(validateBundle(bundle,bundle.editionDate),files);
 assert.throws(()=>extractRssEvidence({...record,title:'インドネシア政府、新たな災害対策の計画を発表'}),/source_attribution_rejected/);
 assert.equal(sourceProvider('発表（共同通信）'),'共同通信');assert.equal(sourceProvider('発表(<script>)'),null);
 assert.equal(shortlist([{...record,title:'インドネシア政府、新計画を発表'}],[{normalizedUrl:url}],[]).length,0);
 assert.equal(shortlist([{...record,description:'<script>'+ 'x'.repeat(100)+'</script>'}],[{normalizedUrl:url}],[]).length,0);
});
test('new Japanese feeds fit the bounded complete collection and retain canonical Yahoo URLs',async()=>{
 const xml=Buffer.from(`<rss version="2.0"><channel><item><title>${record.title}</title><link>${url}?source=rss</link><pubDate>Mon, 12 Oct 2026 04:00:00 GMT</pubDate><description>${record.description}</description></item></channel></rss>`);
 const result=await collectFeeds({schemaVersion:1,window:{start:'2026-10-12T00:00:00Z',end:'2026-10-13T00:00:00Z'},feeds:dailyFeeds},{fetch:async()=>xml});
 assert.equal(result.valid,true);assert.equal(result.report.complete,true);assert.equal(result.report.feeds.length,13);
 assert.equal(result.report.records.find(r=>r.feedId==='yahoo-world').url,url);
});
const atom=link=>Buffer.from(`<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Indonesia disaster planning announcement</title><link href="${link.replace(/&/g,'&amp;')}"/><updated>2026-10-13T00:00:00Z</updated></entry></feed>`);
test('Alerts Atom links unwrap to safe originals, never treating discovery dates as source evidence',()=>{
 const records=parseAlerts(atom('https://www.google.com/url?url='+encodeURIComponent(url)));
 assert.equal(records[0].url,url);assert.equal(records[0].feedTimestamp,'2026-10-13T00:00:00Z');assert.ok(!Object.hasOwn(records[0],'publishedAt'));
 for(const link of ['https://127.0.0.1/private','https://example.com/unsubscribe/fixture','https://user:secret@example.com/a','https://example.com/a?access_token=private','http://example.com/a','https://news.google.com/rss/articles/encoded'])assert.equal(originalLink(link),null);
 assert.throws(()=>parseAlerts(Buffer.from('<!DOCTYPE feed><feed/>')));
 assert.throws(()=>parseAlerts(Buffer.from('<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Ambiguous links</title><link href="https://example.com/a"/><link href="https://example.com/b"/></entry></feed>')),/ambiguous_alert_link/);
 assert.throws(()=>parseAlerts(Buffer.alloc(1048577)));
 assert.throws(()=>parseAlerts(Buffer.from('<feed xmlns="http://www.w3.org/2005/Atom"><entry>')));
});
test('optional Alerts configuration and failures do not leak subscription URLs or trigger arbitrary requests',async()=>{
 let calls=0;assert.equal((await readAlerts(null)).configured,false);assert.equal((await readAlerts({schemaVersion:1,feeds:[]})).configured,false);
 const invalid=await readAlerts({schemaVersion:1,feeds:['https://example.com/feed']},{fetch:async()=>{calls++;}});assert.equal(invalid.configurationInvalid,true);assert.equal(calls,0);
 const config={schemaVersion:1,feeds:['https://www.google.com/alerts/feeds/synthetic/fixture']};assert.equal(validConfig(config),true);
 const good=await readAlerts(config,{fetch:async(_,options)=>{calls++;assert.equal(options.timeoutMs,5000);return atom(url);}});
 assert.equal(good.candidates[0].originalVerified,false);assert.ok(!JSON.stringify(good).includes('/alerts/feeds/'));
 const failed=await readAlerts(config,{fetch:async()=>{throw new Error(config.feeds[0]);}});assert.equal(failed.feeds[0].status,'failed');assert.ok(!JSON.stringify(failed).includes('synthetic'));
 assert.equal(validConfig({...config,feeds:[...config.feeds,...config.feeds]}),false);
});
test('discovery only prefers independently accepted originals; ambiguous titles and unknown URLs stay private',()=>{
 const accepted=[{normalizedUrl:url}];const direct=reconcileCandidates([{url,title:'untrusted discovery',publishedAt:'2100-01-01'}],[record],accepted);
 assert.deepEqual(direct.preferredUrls,[url]);assert.equal(direct.identityVerified,false);
 const hinted=reconcileCandidates([{googleUrl:'https://news.google.com/rss/articles/encoded',title:record.title.replace('(共同通信)',' - Yahoo!ニュース')}],[record],accepted);
 assert.equal(hinted.uniqueTitleHints,1);
 const other={...record,url:'https://news.yahoo.co.jp/articles/'+'b'.repeat(40)};
 assert.equal(reconcileCandidates([{title:record.title}],[record,other],[...accepted,{normalizedUrl:other.url}]).preferredUrls.length,0);
 assert.equal(reconcileCandidates([{url,title:record.title}],[record],[]).preferredUrls.length,0);
});
