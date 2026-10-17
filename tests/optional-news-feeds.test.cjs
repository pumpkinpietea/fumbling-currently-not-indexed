const {test}=require('node:test'),assert=require('node:assert/strict');
const {FEEDS,collectFeeds,publicationReady}=require('../scripts/collect-feeds.cjs');
const {dailyFeeds}=require('../scripts/news-source-policy.cjs');
const {captureRss,collectArchived,validSnapshot,slot,key}=require('../scripts/rss-archive.cjs');
const {produce}=require('../scripts/daily-news.cjs');
const window={start:'2026-10-09T17:00:00Z',end:'2026-10-10T17:00:00Z'},instant=new Date('2026-10-11T00:30:00Z');
const record={feedId:'antara-top-news',itemIndex:0,title:'Indonesia expands digital services',url:'https://www.antaranews.com/berita/1234567/indonesia-digital-services',publicationDatesRaw:['Sat, 10 Oct 2026 10:00:00 GMT'],publishedAt:'2026-10-10T10:00:00Z',description:'Indonesia announced an expansion of digital public services.'};
function report(failures=['setkab-news-en']){return {schemaVersion:1,complete:!failures.length,feeds:dailyFeeds.map(id=>({id,url:FEEDS[id].url,status:failures.includes(id)?'failed':'ok',error:failures.includes(id)?'feed_timeout':null,itemCount:id===record.feedId&&!failures.includes(id)?1:0})),records:failures.includes(record.feedId)?[]:[record],selection:{accepted:[{normalizedUrl:record.url}],rejected:[],window}};}
function memory(){const data=new Map();return {data,read:async name=>data.has(name)?{value:data.get(name)}:null,write:async(name,value)=>{if(data.has(name))throw Error('state_already_exists');data.set(name,value);return '1';}};}
test('only three enrichment feeds are optional; required/all failures still block',()=>{
 assert.deepEqual(dailyFeeds.filter(id=>FEEDS[id].dailyOptional),['vietnam-news-sci-tech','yahoo-it','setkab-news-en']);
 for(const failures of [[],['setkab-news-en'],['vietnam-news-sci-tech','yahoo-it','setkab-news-en']])assert.equal(publicationReady(report(failures),dailyFeeds),true);
 for(const failures of [['ecns-news'],['antara-top-news'],dailyFeeds])assert.equal(publicationReady(report(failures),dailyFeeds),false);
 for(const alter of [r=>r.feeds.pop(),r=>r.feeds[0].id='unknown',r=>r.feeds.reverse(),r=>r.feeds.at(-1).error='unrecognized',r=>r.feeds.at(-1).itemCount=1]){const bad=report();alter(bad);assert.equal(publicationReady(bad,dailyFeeds),false);}
});
test('real collector keeps optional failure/incomplete health visible while required feeds remain usable',async()=>{
 const xml=Buffer.from('<rss version="2.0"><channel></channel></rss>');
 for(const fail of ['setkab-news-en','ecns-news']){const result=await collectFeeds({schemaVersion:1,window,feeds:dailyFeeds},{concurrency:4,fetch:async url=>{if(url===FEEDS[fail].url)throw Error('feed_timeout');return xml;}});assert.equal(result.report.complete,false);assert.equal(result.report.publicationReady,fail==='setkab-news-en');assert.equal(result.report.feeds.find(f=>f.id===fail).error,'feed_timeout');}
});
test('optional partial snapshots retain honest coverage and can supply healthy original evidence',async()=>{
 const state=memory(),input={schemaVersion:1,window,feeds:dailyFeeds};
 const captured=await captureRss({state,instant,collect:async()=>({valid:true,report:report()})});assert.equal(captured.status,'rss_captured_partial');assert.deepEqual(captured.failedFeeds,['setkab-news-en']);
 const saved=state.data.get(key(instant));assert.equal(saved.complete,false);assert.equal(validSnapshot(saved,slot(instant),instant),true);
 const result=await collectArchived(input,{state,instant,retainLive:false,collect:async()=>({valid:true,report:report()})});assert.equal(result.report.complete,false);assert.equal(result.report.publicationReady,true);assert.deepEqual(result.report.records,[record]);assert.deepEqual(result.report.archive.optionalFeedFailures,['setkab-news-en']);assert.equal(result.report.archive.coverageComplete,false);assert.equal(result.report.archive.incomplete.length,1);
 const failed=await collectArchived(input,{state,instant,collect:async()=>({valid:true,report:report(['ecns-news'])})});assert.equal(failed.valid,false);assert.equal(failed.report.publicationReady,false);
});
test('metadata producer proceeds on optional enrichment failure with zero inference and explicit health',async()=>{
 const state=memory(),input={schemaVersion:1,window,feeds:dailyFeeds};
 const result=await produce({instant,trial:true,metadataOnly:true,revision:'c'.repeat(40),model:'synthetic',state,
  collect:request=>collectArchived(request,{state,instant,retainLive:false,collect:async()=>({valid:true,report:report()})}),infer:async()=>assert.fail('metadata cannot invoke model')});
 assert.equal(result.sources,1);assert.equal(result.modelCalls,0);const health=state.data.get('evidence/feed-health-metadata-cccccccccccc-2026-10-11.json');assert.equal(health.complete,false);assert.equal(health.publicationReady,true);assert.equal(health.feeds.find(f=>f.id==='setkab-news-en').status,'failed');assert.ok([...state.data.keys()].every(n=>!n.startsWith('bundles/')));
});
test('optional enrichment cannot crowd required records out of the500-record collection budget',async()=>{
 const core=dailyFeeds.filter(id=>!FEEDS[id].dailyOptional),last=core.at(-1);
 const result=await collectFeeds({schemaVersion:1,window,feeds:dailyFeeds},{concurrency:4,fetch:async url=>{
  const id=dailyFeeds.find(id=>FEEDS[id].url===url),count=FEEDS[id].dailyOptional?20:id===last?20:40;
  const xml='<rss version="2.0"><channel>'+Array.from({length:count},(_,i)=>`<item><title>Synthetic Indonesia digital services ${i}</title><link>https://www.antaranews.com/berita/${1234567+i}/synthetic-services</link><pubDate>Sat, 10 Oct 2026 10:00:00 GMT</pubDate></item>`).join('')+'</channel></rss>';return Buffer.from(xml);
 }});
 assert.equal(result.report.records.length,500);assert.equal(result.report.publicationReady,true);assert.equal(result.report.complete,false);assert.ok(result.report.feeds.filter(f=>core.includes(f.id)).every(f=>f.status==='ok'));assert.ok(result.report.feeds.filter(f=>FEEDS[f.id].dailyOptional).every(f=>f.error==='collection_record_limit'));
});
test('producer cannot trust a forged readiness flag to waive a required-feed failure',async()=>{
 const state=memory();await assert.rejects(produce({instant,trial:true,metadataOnly:true,revision:'d'.repeat(40),model:'synthetic',state,collect:async()=>({valid:true,report:{...report(['ecns-news']),publicationReady:true}}),infer:async()=>assert.fail('required failure must block inference')}),/incomplete_collection/);
 assert.equal(state.data.get('evidence/feed-health-metadata-dddddddddddd-2026-10-11.json').publicationReady,false);assert.ok([...state.data.keys()].every(n=>!n.startsWith('bundles/')));
});
