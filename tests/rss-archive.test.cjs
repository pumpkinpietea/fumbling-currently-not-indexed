const {test}=require('node:test');
const assert=require('node:assert/strict');
const {captureRss,saveSnapshot,validSnapshot,slot,key,collectArchived,mergeRecords,snapshotHours,runtimeMode}=require('../scripts/rss-archive.cjs');
const {dailyFeeds}=require('../scripts/news-source-policy.cjs');
const {FEEDS,collectFeeds,validRequest}=require('../scripts/collect-feeds.cjs');
const {publicationTime}=require('../scripts/rss-metadata.cjs');
const window={start:'2026-10-09T17:00:00Z',end:'2026-10-10T17:00:00Z'},instant=new Date('2026-10-11T00:30:00Z');
const article=(n,date='2026-10-10T10:00:00Z',changes={})=>({feedId:'yahoo-world',itemIndex:n%200,title:'Indonesia expands cloud services (Synthetic Outlet)',url:`https://news.yahoo.co.jp/articles/${n.toString(16).padStart(40,'0')}`,publicationDatesRaw:[new Date(date).toUTCString()],publishedAt:date,description:'Indonesia announced a cloud services initiative across its digital economy.',...changes});
function report(records=[],failedFeed){return {schemaVersion:1,collectedAt:instant.toISOString(),complete:!failedFeed,
 feeds:dailyFeeds.map(id=>({id,url:FEEDS[id].url,status:id===failedFeed?'failed':'ok',error:id===failedFeed?'feed_timeout':null,itemCount:records.filter(r=>r.feedId===id).length})),records,selection:{window,accepted:[],rejected:[]}};}
function memory(){const data=new Map(),reads=[],writes=[];return {data,reads,writes,state:{read:async(name)=>{assert.ok(name.startsWith('evidence/rss-hour-'));reads.push(name);return data.has(name)?{value:data.get(name),generation:'1'}:null;},write:async(name,value)=>{assert.ok(name.startsWith('evidence/rss-hour-'));if(data.has(name))throw new Error('state_already_exists');writes.push(name);data.set(name,structuredClone(value));return '1';}}};}
const input={schemaVersion:1,window,feeds:dailyFeeds};
test('rotating feeds retain previous-day originals, raw dates and provider; current-day records cannot leak in',async()=>{
 const h=memory(),yesterday=new Date('2026-10-10T12:30:00Z'),retained=article(1),current=article(2,'2026-10-11T00:10:00Z');
 await captureRss({state:h.state,instant:yesterday,collect:async()=>({valid:true,report:report([retained])})});
 const result=await collectArchived(input,{state:h.state,instant,collect:async()=>({valid:true,report:report([current])})});
 assert.deepEqual(result.report.records,[retained]);assert.equal(result.report.selection.accepted.length,1);assert.equal(result.report.archive.present,2);assert.equal(result.report.archive.expected,32);assert.equal(result.report.archive.coverageComplete,false);assert.ok(result.report.archive.missing.length);assert.deepEqual(result.report.records[0].publicationDatesRaw,retained.publicationDatesRaw);assert.ok(h.reads.every(n=>!n.includes('auth/')));
});
test('capture is credential/model/publication-isolated, idempotent and bounded-concurrency',async()=>{
 const h=memory();let calls=0;
 const collect=async(request,options)=>{assert.equal(validRequest(request),true);calls++;assert.equal(options.concurrency,4);return {valid:true,report:report([article(1)])};};
 const precise=new Date(instant.getTime()+456);assert.equal((await captureRss({state:h.state,instant:precise,collect})).modelCalls,0);assert.equal((await captureRss({state:h.state,instant:precise,collect})).status,'already_captured');assert.equal(calls,1);assert.equal(h.writes.length,1);
 let active=0,peak=0;
 const response=Buffer.from('<rss><channel><item><title>Indonesia cloud services</title><link>https://www.antaranews.com/berita/1234567/indonesia-cloud</link><pubDate>Sat, 10 Oct 2026 10:00:00 GMT</pubDate><description>Indonesia announced a cloud services initiative across its digital economy.</description></item></channel></rss>');
 const result=await collectFeeds(input,{concurrency:4,fetch:async()=>{active++;peak=Math.max(peak,active);await new Promise(r=>setTimeout(r,2));active--;return response;}});
 assert.equal(result.valid,true);assert.equal(peak,4);assert.deepEqual(result.report.feeds.map(f=>f.id),dailyFeeds);
 assert.equal((await collectFeeds(input,{concurrency:5})).valid,false);
});
test('partial and missing archives are visible; failed live collection never borrows stale success',async()=>{
 const h=memory();const partial=report([article(1)],'ecns-news');
 assert.equal((await captureRss({state:h.state,instant:new Date('2026-10-10T12:30:00Z'),collect:async()=>({valid:true,report:partial})})).status,'rss_capture_incomplete');
 const result=await collectArchived(input,{state:h.state,instant,retainLive:false,collect:async()=>({valid:true,report:report()})});assert.equal(result.report.archive.incomplete.length,1);assert.equal(result.report.archive.coverageComplete,false);assert.equal(result.report.records.length,1);
 const failed=await collectArchived(input,{state:h.state,instant,collect:async()=>({valid:true,report:partial})});assert.equal(failed.report.complete,false);
 const unavailable=memory();unavailable.state.read=async()=>{throw new Error('synthetic_private_failure');};
 const readResult=await collectArchived(input,{state:unavailable.state,instant,retainLive:false,collect:async()=>({valid:true,report:report()})});assert.equal(readResult.report.archive.failedReads.length,32);assert.ok(!JSON.stringify(readResult).includes('synthetic_private_failure'));
 for(const error of [new SyntaxError('synthetic malformed private JSON'),new Error('response_size_limit')]){unavailable.state.read=async()=>{throw error;};await assert.rejects(collectArchived(input,{state:unavailable.state,instant,retainLive:false,collect:async()=>({valid:true,report:report()})}),/invalid_rss_snapshot/);}
});
test('snapshot validation rejects corrupt dates, provenance, future slots and byte/record overflow',async()=>{
 const h=memory();await saveSnapshot(h.state,report([article(1)]),instant);const good=h.data.get(key(instant));assert.equal(validSnapshot(good,slot(instant),instant),true);
 for(const alter of [v=>v.records[0]=null,v=>v.feeds[0]=null,v=>v.records[0].publishedAt='2026-10-10T11:00:00Z',v=>v.records[0].feedId='private-google',v=>v.records[0].publicationDatesRaw=['invalid'],v=>v.capturedAt='2026-10-11T00:31:00Z',v=>v.feeds[0].url='https://unreviewed.example/',v=>v.records[0].title='x'.repeat(501),v=>v.records=Array(501).fill(article(1)),v=>v.padding='x'.repeat(1048576)]){const bad=structuredClone(good);alter(bad);assert.equal(validSnapshot(bad,slot(instant),instant),false);}
 const large=structuredClone(good);large.records=Array.from({length:130},(_,i)=>article(i,undefined,{description:'x'.repeat(8000)}));large.feeds.find(f=>f.id==='yahoo-world').itemCount=130;assert.ok(Buffer.byteLength(JSON.stringify(large))>1048576);assert.equal(validSnapshot(large,slot(instant),instant),false);
 h.data.get(key(instant)).records[0].publishedAt='2026-10-10T11:00:00Z';await assert.rejects(collectArchived(input,{state:h.state,instant,retainLive:false,collect:async()=>({valid:true,report:report()})}),/invalid_rss_snapshot/);
});
test('dedup keeps latest whole evidence, quarantines date conflicts and bounds relevant union',()=>{
 const old=article(1),latest=article(1,old.publishedAt,{description:'Indonesia announced expanded cloud services for its digital economy.'});
 assert.deepEqual(mergeRecords(report([latest]),[{records:[old]}],window).report.records,[latest]);
 assert.equal(mergeRecords(report([article(1,'2026-10-11T00:10:00Z')]),[{records:[old]}],window).report.records.length,0);
 const irrelevant=article(2,old.publishedAt,{title:'China updates railway passenger services (Synthetic Outlet)',description:'China announced railway passenger service updates in its provinces.'});assert.equal(mergeRecords(report([irrelevant]),[],window).audit.scopeRejected,1);
 assert.throws(()=>mergeRecords(report(Array.from({length:501},(_,i)=>article(i))),[],window),/archive_record_limit/);
});
test('UTC slots cover previous Jakarta day and late morning; only 07:30–07:59 scheduled work generates',()=>{
 assert.equal(snapshotHours(window,instant).length,32);assert.equal(slot(snapshotHours(window,instant)[0]),'2026-10-09-17');assert.equal(slot(snapshotHours(window,instant).at(-1)),'2026-10-11-00');
 for(const [time,mode]of [['2026-10-10T23:30:00Z','capture'],['2026-10-11T00:29:00Z','capture'],['2026-10-11T00:30:00Z','daily'],['2026-10-11T00:59:00Z','daily'],['2026-10-11T01:30:00Z','capture']])assert.equal(runtimeMode(['--scheduled'],new Date(time)),mode);
 assert.equal(runtimeMode(['--capture-rss'],instant),'capture');assert.equal(runtimeMode(['--metadata-trial'],instant),'explicit');assert.equal(runtimeMode([],instant),'explicit');
 assert.throws(()=>snapshotHours({start:window.start,end:'2026-10-12T17:00:00Z'},instant),/invalid_archive_window/);
 assert.equal(publicationTime('Sat, 10 Oct 2026 10:00:00 GMT'),article(1).publishedAt);
});
test('archived original reaches metadata-only production wiring without any app credential or model call',async()=>{
 const {produce}=require('../scripts/daily-news.cjs');
 const fs=require('fs'),os=require('os'),path=require('path'),work=fs.mkdtempSync(path.join(os.tmpdir(),'rss-archive-test-'));fs.chmodSync(work,0o700);
 const h=memory();await saveSnapshot(h.state,report([article(1)]),new Date('2026-10-10T12:30:00Z'));const outputs=new Map();
 const state={read:async name=>{assert.notEqual(name,'auth/session.json');return name.startsWith('evidence/rss-hour-')?h.state.read(name):null;},write:async(name,value)=>{outputs.set(name,value);return '1';}};
 try{const result=await produce({instant,trial:true,metadataOnly:true,revision:'b'.repeat(40),model:'synthetic-model',state,credentialFile:work+'/never-created.json',workDirectory:work,
  collect:request=>collectArchived(request,{state:h.state,instant,retainLive:false,collect:async()=>({valid:true,report:report([article(2,'2026-10-11T00:10:00Z')])})}),infer:async()=>assert.fail('metadata must not invoke inference')});
 assert.equal(result.modelCalls,0);assert.equal(result.sources,1);assert.equal(fs.existsSync(work+'/never-created.json'),false);const audit=outputs.get('evidence/source-selection-metadata-bbbbbbbbbbbb-2026-10-11.json');assert.equal(audit.archive.present,1);assert.equal(audit.publishers['provider:syntheticoutlet'].selected,1);assert.ok([...outputs.keys()].every(name=>!name.startsWith('bundles/')));
 }finally{fs.rmSync(work,{recursive:true,force:true});}
});
test('invalid latest excerpt cannot replace usable earlier evidence, but changed raw dates remain quarantined',()=>{
 const old=article(1),bad=article(1,old.publishedAt,{description:null});assert.deepEqual(mergeRecords(report([bad]),[{records:[old]}],window).report.records,[old]);assert.equal(mergeRecords(report([bad]),[{records:[old]}],window).audit.invalidEvidence,1);
});
test('old registry snapshots remain usable after expansion but missing feed coverage stays explicit',async()=>{
 const h=memory(),oldInstant=new Date('2026-10-10T12:30:00Z'),old=report([article(1)]);
 const added=['vietnam-news-sci-tech','yahoo-it','setkab-news-en'];old.feeds=old.feeds.filter(f=>!added.includes(f.id));
 await saveSnapshot(h.state,old,oldInstant);const value=h.data.get(key(oldInstant));assert.equal(validSnapshot(value,slot(oldInstant),instant),true);
 const result=await collectArchived(input,{state:h.state,instant,retainLive:false,collect:async(request,options)=>{assert.equal(options.concurrency,4);return {valid:true,report:report()};}});
 assert.deepEqual(result.report.records,[article(1)]);assert.equal(result.report.archive.coverageComplete,false);assert.deepEqual(result.report.archive.missingFeeds,[{slot:slot(oldInstant),feeds:added}]);
 for(const alter of [v=>v.feeds.push(v.feeds[0]),v=>v.feeds.reverse(),v=>v.feeds[0].id='private-unknown',v=>v.feeds=[],v=>v.records[0].feedId='yahoo-it']){const bad=structuredClone(value);alter(bad);assert.equal(validSnapshot(bad,slot(oldInstant),instant),false);}
 await assert.rejects(collectArchived(input,{state:h.state,instant,retainLive:false,collect:async()=>({valid:true,report:old})}),/incomplete_collection/);
});
