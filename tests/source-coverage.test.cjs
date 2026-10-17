const {test}=require('node:test'),assert=require('node:assert/strict');
const {extractRssEvidence}=require('../scripts/news-evidence.cjs');
const {shortlist,validateBundle,renderDailyEditions,produce}=require('../scripts/daily-news.cjs');
const {relevantTech}=require('../scripts/news-relevance.cjs');
const {sourcePolicy,dailyFeeds}=require('../scripts/news-source-policy.cjs');
const {collectFeeds,validRequest}=require('../scripts/collect-feeds.cjs');
const {validateEditorialHistory}=require('../scripts/news-history.cjs');
const metadata=require('../data/news_sources.json'),labels=require('../data/news_labels.json');
const japanese={feedId:'jetro-biznews-ja',title:'タイ、11月1日から全ての法人登記を完全オンライン化(タイ)',url:'https://www.jetro.go.jp/biznews/2026/10/aaaaaaaaaaaaaaaa',publishedAt:'2026-10-13T15:00:01Z'};
const accepted=records=>records.map(r=>({normalizedUrl:r.url}));
test('complete Japanese institutional headlines survive schema5 but legacy evidence remains40 characters',()=>{
 const source=extractRssEvidence(japanese);assert.equal(source.excerpt,japanese.title);assert.equal(source.excerpt.length,30);
 assert.deepEqual(shortlist([japanese],accepted([japanese]),[]),[japanese]);
 const event={editions:['tech'],sourceIds:[source.id],en:{title:'Thailand moves corporate registration online from November 1',summary:'Thailand will make all corporate registration fully online from November 1, JETRO reports.'},jp:{title:'タイ、11月1日から法人登記をオンライン化',summary:'JETROによると、タイは11月1日から全ての法人登記を完全オンライン化する。'},quotes:[{sourceId:source.id,text:japanese.title}]};
 const bundle={schemaVersion:5,editionDate:'2026-10-14',revision:'a'.repeat(40),sources:[source],events:[event],review:{approved:true,checkedIds:[source.id]},files:renderDailyEditions('2026-10-14',[event],[source])};
 assert.deepEqual(validateBundle(bundle,bundle.editionDate),bundle.files);
 for(const version of [1,2,3,4]){const old=structuredClone(bundle);old.schemaVersion=version;if(version<4)delete old.events[0].editions;assert.throws(()=>validateBundle(old,old.editionDate),/invalid_bundle_evidence/);}
 for(const title of ['タイ、オンライン化を発表','<script>'+ 'テスト'.repeat(30)+'</script>','Thailand online update'])assert.throws(()=>extractRssEvidence({...japanese,title}),/insufficient_rss_evidence/);
 const cabinet={...japanese,feedId:'setkab-news-en',url:'https://setkab.go.id/en/indonesia-digital-policy/'};
 assert.throws(()=>extractRssEvidence(cabinet),/insufficient_rss_evidence/);
 const changed=structuredClone(bundle);changed.sources[0].excerpt+='追加';assert.throws(()=>validateBundle(changed,bundle.editionDate),/invalid_bundle_evidence/);
});
test('quantum computing and Vietnamese cities match, while foreign or nontechnology stories do not',()=>{
 for(const text of ['Pasqal proposes Việt Nam as Southeast Asia quantum computing hub','Hà Nội expands digital services','Bắc Ninh develops semiconductor infrastructure','Kuala Lumpur expands e-commerce services','ベトナムで量子コンピューター研究を開始','タイ・オンライン登記を開始','Vietnam expands e‑commerce services'])assert.equal(relevantTech(text),true,text);
 for(const text of ['Google advances quantum computing in California','Thailand celebrates a cultural festival','Vietnam studies quantum mechanics in abstract physics','タイトルの編集方針について発表','IRGC conducts a drill in SE Iran'])assert.equal(relevantTech(text),false,text);
});
test('bad evidence and HTML-only keywords cannot occupy slots and exclusions are visible',()=>{
 const records=[japanese,{...japanese,url:japanese.url+'b',title:'タイ、オンライン化を発表'},{feedId:'vietnam-news-economy',url:'https://vietnamnews.vn/economy/1234567/festival.html',title:'A festival in Vietnam',publishedAt:japanese.publishedAt,description:'<img alt="cloud technology" src="https://example.com/Indonesia-digital"/>Vietnam celebrates a traditional cultural festival this week.'},{feedId:'vietnam-news-economy',url:'https://vietnamnews.vn/economy/1234568/cloud.html',title:'Vietnam expands cloud services',publishedAt:japanese.publishedAt,description:'Too short'}];
 const audit={};assert.deepEqual(shortlist(records,accepted(records),[],[],audit),[japanese]);assert.equal(audit.jetro.evidenceRejected,1);assert.equal(audit['vietnam-news'].evidenceRejected,1);assert.equal(audit['vietnam-news'].relevanceRejected,1);
});
test('new feed provenance is exact, cabinet evidence is headline only and source badge is institutional',async()=>{
 assert.equal(dailyFeeds.length,16);for(const id of ['vietnam-news-sci-tech','yahoo-it','setkab-news-en'])assert.ok(dailyFeeds.includes(id));
 const tech={feedId:'vietnam-news-sci-tech',title:'Viet Nam advances quantum computing research',description:'Viet Nam announced a regional quantum computing research proposal.',publishedAt:japanese.publishedAt,url:'https://vietnamnews.vn/Sci-Tech/1234567/quantum.html'};
 assert.equal(extractRssEvidence(tech).publisher,'Viet Nam News');assert.equal(sourcePolicy({...tech,url:tech.url.replace('Sci-Tech','SCI-TECH')}),null);
 const cabinet={feedId:'setkab-news-en',title:'President Prabowo announces Indonesia digital services initiative',publishedAt:japanese.publishedAt,url:'https://setkab.go.id/en/indonesia-digital-services/',description:'Never use this unreviewed description'};
 const source=extractRssEvidence(cabinet);assert.equal(source.excerpt,cabinet.title);assert.equal(source.evidenceType,'official_rss_title');assert.equal(metadata['setkab.go.id'].country,'ID');assert.equal(labels.types[metadata['setkab.go.id'].type].jp,'機関発表');assert.equal(sourcePolicy({...cabinet,url:'https://setkab.go.id/wp-content/media.jpg'}),null);
 const input={schemaVersion:1,window:{start:'2026-10-13T00:00:00Z',end:'2026-10-14T00:00:00Z'},feeds:dailyFeeds};assert.equal(validRequest(input),true);assert.equal(validRequest({...input,feeds:[...dailyFeeds,'antara-economy']}),false);
 const xml=Buffer.from('<rss version="2.0"><channel><item><title>Indonesia digital services (Synthetic Outlet)</title><link>https://news.yahoo.co.jp/articles/'+ 'a'.repeat(40)+'?source=rss</link><pubDate>Tue, 13 Oct 2026 10:00:00 GMT</pubDate><description>Indonesia announced an expansion of digital public services.</description></item></channel></rss>');
 const result=await collectFeeds(input,{concurrency:4,fetch:async()=>xml});assert.equal(result.report.complete,true);assert.equal(result.report.records.find(r=>r.feedId==='yahoo-it').url,'https://news.yahoo.co.jp/articles/'+'a'.repeat(40));
});
const editorial={schemaVersion:1,status:'published',editionDate:'2026-10-13',publishedAt:'2026-10-13T10:00:00Z',sourceUrls:[japanese.url],eventHints:['Thailand corporate registration online']};
test('dated editorial history rejects invalid/future markers and suppresses already published URLs',()=>{
 assert.equal(validateEditorialHistory(editorial,'2026-10-13',new Date('2026-10-14T00:30:00Z')),editorial);
 for(const alter of [v=>v.status='draft',v=>v.publishedAt='2026-10-15T00:00:00Z',v=>v.sourceUrls=['https://user:secret@example.com/a'],v=>v.sourceUrls.push(v.sourceUrls[0]),v=>v.eventHints=['<script>injected</script>'],v=>v.extra=true]){const bad=structuredClone(editorial);alter(bad);assert.throws(()=>validateEditorialHistory(bad,'2026-10-13',new Date('2026-10-14T00:30:00Z')),/invalid_editorial_history/);}
 assert.deepEqual(shortlist([japanese],accepted([japanese]),editorial.sourceUrls),[]);
});
test('producer reads bounded editorial history before metadata selection without credentials or model calls',async()=>{
 const outputs=new Map(),reads=[];const state={read:async name=>{reads.push(name);assert.notEqual(name,'auth/session.json');return name==='evidence/editorial-published-2026-10-13.json'?{value:editorial}:null;},write:async(name,value)=>{outputs.set(name,value);return '1';}};
 const result=await produce({instant:new Date('2026-10-14T00:30:00Z'),trial:true,metadataOnly:true,revision:'a'.repeat(40),model:'synthetic',state,collect:async()=>({valid:true,report:{complete:true,records:[japanese],selection:{accepted:accepted([japanese])}}}),infer:async()=>assert.fail('metadata cannot call model')});
 assert.equal(result.sources,0);assert.equal(result.modelCalls,0);assert.equal(reads.filter(n=>n.startsWith('evidence/editorial-published-')).length,14);assert.equal(outputs.get('evidence/source-selection-metadata-aaaaaaaaaaaa-2026-10-14.json').publishers.jetro.historyOrDuplicate,1);assert.ok([...outputs.keys()].every(n=>!n.startsWith('bundles/')));
});
test('Yahoo provider names cannot masquerade as Thailand or supply a missing technology subject',()=>{
 const records=[{feedId:'yahoo-it',title:'ドコモ、国内の緊急速報配信の不具合について原因を発表(ケータイ Watch)',description:'日本国内の携帯電話向け緊急速報サービスについて、通信会社が不具合の原因と対応方針を説明した。',publishedAt:japanese.publishedAt,url:'https://news.yahoo.co.jp/articles/'+'a'.repeat(40)}];
 assert.deepEqual(shortlist(records,accepted(records),[]),[]);
 const legitimate={...records[0],title:'タイ、携帯電話の緊急速報サービスを拡充(ケータイ Watch)'};assert.deepEqual(shortlist([legitimate],accepted([legitimate]),[]),[legitimate]);
});
