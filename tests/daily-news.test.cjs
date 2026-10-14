const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { extractRssEvidence } = require('../scripts/news-evidence.cjs');
const { validateEvents, validateBundle, renderEdition, renderDailyEditions, shortlist, produce } = require('../scripts/daily-news.cjs');
const settings = require('../config/news-publishing.json');
const record = { url: 'https://www.antaranews.com/berita/1234567/indonesia-digital-services',
  title: 'Indonesia expands digital services', publishedAt: '2026-10-10T04:00:00Z',
  description: '<p>Indonesia announced a digital services initiative. The ministry described its plans.</p>' };
const source = extractRssEvidence(record);
const event = { sourceIds: [source.id],
  en: { title: 'Indonesia announces digital services plans', summary: 'Indonesia announced a digital services initiative, according to the ministry.' },
  jp: { title: 'インドネシア、デジタルサービスの計画を発表', summary: 'インドネシアの省はデジタルサービスに関する取り組みを発表しました。' },
  quotes: [{ sourceId: source.id, text: 'Indonesia announced a digital services initiative.' }] };
const copy = value => structuredClone(value);
test('RSS evidence strips markup, rejects arbitrary hosts and insufficient excerpts', () => {
  assert.ok(source.excerpt.includes('Indonesia announced'));assert.ok(!source.excerpt.includes('<p>'));
  assert.throws(() => extractRssEvidence({ ...record, url: 'https://127.0.0.1/berita/1234567/a' }));
  assert.throws(() => extractRssEvidence({ ...record, description: 'Too short' }));
});
test('grounding and translation checks reject fabricated quotes, numbers, duplicate sources and markup', () => {
  assert.equal(validateEvents([event], [source]).length, 1);
  for (const alter of [e => { e.quotes[0].text = 'An invented quote absent from this evidence'; },
    e => { e.en.summary += ' It opened 25 stores.'; }, e => { e.jp.title += '<script>'; }]) {
    const e = copy(event);alter(e);assert.throws(() => validateEvents([e], [source]));
  }
  assert.throws(() => validateEvents([event, event], [source]));
});
test('publication bundle binds review, dates, source hash and exactly rendered files', () => {
  const bundle = { schemaVersion: 1, editionDate: '2026-10-11', revision: 'a'.repeat(40), sources: [source],
    events: [event], review: { approved: true, checkedIds: [source.id] }, files: renderEdition('2026-10-11', [event], [source]) };
  assert.equal(Object.keys(validateBundle(bundle, '2026-10-11')).length, 2);
  for (const change of [b => { b.review.approved = false; }, b => { b.sources[0].excerpt += 'changed'; },
    b => { b.files['content/en/article/2026-10-11-southeast-asia-tech.md'] += 'extra'; },
    b => { b.sources[0].publishedAt = '2026-10-09T04:00:00Z'; }]) {
    const b = copy(bundle);change(b);assert.throws(() => validateBundle(b, '2026-10-11'));
  }
});
test('shortlist uses normalized accepted URLs, topic filtering and previous publication URLs', () => {
  const accepted = [{ normalizedUrl: record.url }];
  assert.equal(shortlist([record], accepted, []).length, 1);
  assert.equal(shortlist([record], accepted, [record.url]).length, 0);
  assert.equal(shortlist([{ ...record, title: 'Football match results', description: 'Football match results in Indonesia.' }], accepted, []).length, 1);
});
function harness({ records = [record], complete = true, rejectReview = false, failure } = {}) {
  const objects = new Map([['auth/session.json', { value: { refresh_token: 'synthetic-runtime-fixture' }, generation: '1' }]]);
  let calls = 0;
  const state = { async read(name) { return objects.get(name) || null; },
    async write(name, value, generation = '0') {
      if (generation === '0' && objects.has(name)) throw new Error('state_already_exists');
      objects.set(name, { value, generation: '2' });return '2';
    } };
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'news-runtime-test-'));fs.chmodSync(directory, 0o700);
  const options = { instant: new Date('2026-10-11T00:30:00Z'), replayDate: '2026-10-11', trial: true,
    state, workDirectory: directory, credentialFile: path.join(directory, 'session.json'), model: 'fixture', revision: 'a'.repeat(40),
    collect: async () => ({ valid: true, report: { complete, records, selection: { accepted: records.map(r => ({ normalizedUrl: r.url })) } } }),
    body: async () => source,
    infer: async (request, credential, output, hooks) => {
      calls++;await hooks.onCredentialsSaved({ rotated: calls });
      if (failure) return { valid: false };
      const value = calls === 1 ? { events: [{...event,editions:['indonesia','tech']}] } : { approved: !rejectReview, checkedIds: [source.id] };
      fs.writeFileSync(output, JSON.stringify({ text: JSON.stringify(value) }));return { valid: true };
    } };
  return { objects, options, calls: () => calls, cleanup: () => fs.rmSync(directory, { recursive: true, force: true }) };
}
test('trial persists rotation before inference, requires review and never emits a publication bundle', async () => {
  const h = harness();try {
    assert.equal((await produce(h.options)).status, 'trial_passed');assert.equal(h.calls(), 2);
    assert.equal(h.objects.get('auth/session.json').value.rotated, 2);
    assert.ok(!h.objects.has('bundles/2026-10-11.json'));
    const retained = h.objects.get('evidence/trial-bundle-aaaaaaaaaaaa-2026-10-11.json').value;
    assert.deepEqual(validateBundle(retained, '2026-10-11'), renderDailyEditions('2026-10-11', [event], [source]));
    await assert.rejects(produce(h.options), /state_already_exists/);
  } finally { h.cleanup(); }
});
test('no-news, partial feeds, failed generation and rejected review never publish', async () => {
  for (const config of [{ records: [] }, { complete: false }, { failure: true }, { rejectReview: true }]) {
    const h = harness(config);try {
      if (config.records) { assert.equal((await produce(h.options)).status, 'trial_passed');assert.equal(h.calls(), 0);assert.ok(!h.objects.has('evidence/trial-bundle-aaaaaaaaaaaa-2026-10-11.json'));assert.equal(h.objects.get('runs/trial-aaaaaaaaaaaa-2026-10-11.json').value.status,'no_news'); }
      else await assert.rejects(produce(h.options));
      assert.ok(!h.objects.has('bundles/2026-10-11.json'));
      assert.ok(!h.objects.has('bundles/status-2026-10-11.json'));
      if (config.failure) { assert.equal(h.objects.get('auth/session.json').value.rotated, 1);assert.equal(h.objects.get('evidence/failure-trial-aaaaaaaaaaaa-2026-10-11.json').value.phase,'generation'); }
      if (config.rejectReview) assert.ok(h.objects.has('evidence/model-output-trial-aaaaaaaaaaaa-2026-10-11-review.json'));
    } finally { h.cleanup(); }
  }
});
test('inactive scheduled execution fails before any collection or state mutation', async () => {

  const h = harness();try { await assert.rejects(produce({ ...h.options, replayDate: undefined, trial: false, config: { ...settings, enabled: false } }), /publication_not_active/);assert.equal(h.calls(), 0); }
  finally { h.cleanup(); }
});
test('metadata-only trial cannot read app credentials or invoke AI even with eligible evidence', async () => {
  const h = harness();const read = h.options.state.read;
  h.options.state.read = async name => { assert.notEqual(name, 'auth/session.json');return read(name); };
  h.options.infer = async () => assert.fail('metadata trial must never invoke AI');
  try {
    const result = await produce({ ...h.options, metadataOnly: true });
    assert.equal(result.status, 'metadata_trial_passed');assert.equal(result.sources, 1);assert.equal(result.modelCalls, 0);
    assert.equal(h.objects.get('runs/metadata-aaaaaaaaaaaa-2026-10-11.json').value.status, 'metadata_verified');
    assert.ok(h.objects.has('locks/metadata-aaaaaaaaaaaa-2026-10-11.json'));
    await assert.rejects(produce({ ...h.options, metadataOnly: true }), /state_already_exists/);
    assert.equal((await produce({ ...h.options, metadataOnly: true, revision: 'b'.repeat(40) })).modelCalls, 0);
    assert.ok(h.objects.has('runs/metadata-bbbbbbbbbbbb-2026-10-11.json'));
    assert.ok(!h.objects.has('locks/trial-2026-10-11.json'));
    assert.ok(!h.objects.has('bundles/2026-10-11.json'));
  } finally { h.cleanup(); }
});
test('personal reader is persisted privately and never enters inference or publication', async () => {
  const h = harness();
  const infer = h.options.infer;
  h.options.discover = async () => ({ report: { marker: 'GOOGLE_READER_ONLY_MARKER' }, html: '<p>GOOGLE_READER_ONLY_MARKER</p>', additional: { report: { marker: 'EXTRA_READER_ONLY_MARKER' }, html: '<p>EXTRA_READER_ONLY_MARKER</p>' } });
  h.options.infer = async (...args) => { assert.ok(!JSON.stringify(args[0]).includes('GOOGLE_READER_ONLY_MARKER'));assert.ok(!JSON.stringify(args[0]).includes('EXTRA_READER_ONLY_MARKER'));return infer(...args); };
  try {
    assert.equal((await produce(h.options)).status, 'trial_passed');
    assert.equal(h.objects.get('evidence/google-reader-trial-aaaaaaaaaaaa-2026-10-11.json').value.marker, 'GOOGLE_READER_ONLY_MARKER');
    assert.ok(!JSON.stringify(h.objects.get('evidence/trial-bundle-aaaaaaaaaaaa-2026-10-11.json').value).includes('GOOGLE_READER_ONLY_MARKER'));
    assert.equal(h.objects.get('evidence/additional-reader-trial-aaaaaaaaaaaa-2026-10-11.json').value.marker, 'EXTRA_READER_ONLY_MARKER');
    assert.ok(!JSON.stringify(h.objects.get('evidence/trial-bundle-aaaaaaaaaaaa-2026-10-11.json').value).includes('EXTRA_READER_ONLY_MARKER'));
    assert.ok(!h.objects.has('bundles/2026-10-11.json'));
  } finally { h.cleanup(); }
});

test('failed official collection preserves private health without AI or publication', async () => {
  const h = harness();
  const feeds = [{ id: 'antara-tech', status: 'failed', itemCount: 0, error: 'feed_timeout' }];
  h.options.collect = async () => ({ valid: true, report: { complete: false, feeds } });
  try {
    await assert.rejects(produce({ ...h.options, metadataOnly: true }), /incomplete_collection/);
    assert.deepEqual(h.objects.get('evidence/feed-health-metadata-aaaaaaaaaaaa-2026-10-11.json').value,
      { complete: false, feeds });
    assert.equal(h.calls(), 0);
    assert.ok(!h.objects.has('bundles/2026-10-11.json'));
    assert.ok(!h.objects.has('runs/metadata-aaaaaaaaaaaa-2026-10-11.json'));
    assert.equal(h.objects.get('auth/session.json').value.refresh_token, 'synthetic-runtime-fixture');
  } finally { h.cleanup(); }
});

test('two daily editions share Indonesia tech facts and exclude non-tech foreign news', () => {
  const general = extractRssEvidence({ ...record, url: record.url.replace('1234567','1234568'), title: 'Indonesia parliament discusses education policy', description: 'Indonesia parliament discussed an education policy proposal at its meeting.' });
  const vietnam = extractRssEvidence({ ...record, url: 'https://vietnamnews.vn/economy/12345/vietnam-online-commerce.html', feedId:'vietnam-news-economy', title: 'Vietnam expands online e-commerce services', description: 'Vietnam announced expanded online e-commerce services for businesses.' });
  const make = (s, jpTitle) => ({ sourceIds:[s.id], en:{title:s.title,summary:s.excerpt.split('\n')[1]}, jp:{title:jpTitle,summary:'当局は新たな取り組みについて発表しました。'}, quotes:[{sourceId:s.id,text:s.excerpt.split('\n')[1]}] });
  const events = [make(general,'インドネシアの議会、教育政策を議論'),event,make(vietnam,'ベトナム、オンラインECサービスを拡大')], sources = [general,source,vietnam];
  const files = renderDailyEditions('2026-10-11',events,sources);
  assert.equal(Object.keys(files).length,4);
  const id = files['content/en/article/2026-10-11-indonesia-news.md'], tech = files['content/en/article/2026-10-11-southeast-asia-tech.md'];
  assert.ok(id.includes(general.title) && !id.includes(vietnam.title));
  assert.ok(tech.includes(vietnam.title) && !tech.includes(general.title));
  for (const page of [id,tech]) { assert.ok(page.includes(event.en.summary));assert.ok(page.includes('](#news-1)'));assert.ok(page.includes('{#news-1}')); }
  const foreign = {...general,excerpt:'Thailand parliament discussed education policy with its legislators.'};
  const foreignEvent=make({...foreign,excerpt:'Headline\n'+foreign.excerpt},'タイ議会、教育政策について議論');
  assert.throws(()=>renderDailyEditions('2026-10-11',[foreignEvent],[foreign,source,vietnam]),/irrelevant_event/);
  const bundle = {schemaVersion:2,editionDate:'2026-10-11',revision:'a'.repeat(40),sources,events,review:{approved:true,checkedIds:events.flatMap(e=>e.sourceIds)},files};
  assert.deepEqual(validateBundle(bundle,'2026-10-11'),files);
  const altered = copy(bundle);delete altered.files['content/jp/article/2026-10-11-indonesia-news.md'];assert.throws(()=>validateBundle(altered,'2026-10-11'),/bundle_files_mismatch/);
});
test('complete empty collection records no_news without AI or a bundle and remains idempotent',async()=>{
  const h=harness({records:[]});try {
    const options={...h.options,trial:false,replayDate:undefined};
    assert.equal((await produce(options)).status,'no_news');assert.equal(h.calls(),0);
    assert.ok(!h.objects.has('bundles/2026-10-11.json'));
    assert.equal(h.objects.get('runs/2026-10-11.json').value.status,'no_news');
    await assert.rejects(produce(options),/state_already_exists/);
  }finally{h.cleanup();}
});
test('empty reviewed generation records no_news but failed review never does',async()=>{
  for(const approved of [true,false]){
    const h=harness();let calls=0;
    h.options.infer=async(req,cred,out)=>{calls++;fs.writeFileSync(out,JSON.stringify({text:JSON.stringify(calls===1?{events:[]}:{approved,checkedIds:[]})}));return {valid:true};};
    try{
      if(approved){assert.equal((await produce({...h.options,trial:false,replayDate:undefined})).status,'no_news');assert.equal(h.objects.get('runs/2026-10-11.json').value.status,'no_news');}
      else{await assert.rejects(produce(h.options),/review_rejected/);assert.ok(!h.objects.has('runs/trial-aaaaaaaaaaaa-2026-10-11.json'));}
      assert.equal(calls,2);assert.ok(!h.objects.has('bundles/2026-10-11.json'));
    }finally{h.cleanup();}
  }
});
test('one populated topic publishes only its pair and retained empty bundles stay verifiable',()=>{
  const {publicationFiles,rehearsalFiles}=require('../scripts/publish-news-bundle.cjs');
  for(const tech of [false,true]){
    const r={...record,title:tech?'Vietnam expands digital services':'Indonesia parliament discusses education policy',description:tech?'Vietnam announced a digital services initiative.':'Indonesia parliament discussed its education policy proposal.'};
    const s=extractRssEvidence(r),e={sourceIds:[s.id],en:{title:r.title,summary:r.description},jp:{title:'新たな取り組みについて発表',summary:'新たな取り組みについて発表しました。'},quotes:[{sourceId:s.id,text:r.description}]};
    const files=renderDailyEditions('2026-10-11',[e],[s]);assert.equal(Object.keys(files).length,2);
    const slug=tech?'southeast-asia-tech':'indonesia-news';assert.ok(Object.keys(files).every(f=>f.endsWith(slug+'.md')));
    const b={schemaVersion:3,editionDate:'2026-10-11',revision:'a'.repeat(40),sources:[s],events:[e],review:{approved:true,checkedIds:[s.id]},files};
    assert.deepEqual(publicationFiles(b,b.editionDate),files);assert.equal(Object.keys(rehearsalFiles(b,b.editionDate)).length,2);
    const tampered=copy(b);tampered.files['content/en/article/2026-10-11-extra.md']='injected';assert.throws(()=>validateBundle(tampered,b.editionDate),/bundle_files_mismatch/);
    b.schemaVersion=2;b.files=renderDailyEditions(b.editionDate,b.events,b.sources,{includeEmpty:true});assert.equal(Object.keys(validateBundle(b,b.editionDate)).length,4);assert.deepEqual(publicationFiles(b,b.editionDate),files);
  }
  const empty={schemaVersion:2,editionDate:'2026-10-11',revision:'a'.repeat(40),sources:[],events:[],review:{approved:true,checkedIds:[]},files:renderDailyEditions('2026-10-11',[],[],{includeEmpty:true})};
  assert.deepEqual(publicationFiles(empty,empty.editionDate),{});assert.deepEqual(rehearsalFiles(empty,empty.editionDate),{});
});
test('shortlist reserves sources for both topics instead of letting general stories starve tech',()=>{
  const records=Array.from({length:5},(_,i)=>({...record,url:record.url.replace('1234567',String(1234570+i)),title:'Indonesia parliament discusses education',description:'Indonesia parliament discusses education policy.'}));
  const tech={...record,url:record.url.replace('1234567','1234580'),title:'Vietnam e-commerce services expand',description:'Vietnam e-commerce firms expanded online services.'};records.push(tech);
  const selected=shortlist(records,records.map(r=>({normalizedUrl:r.url})),[]);
  assert.equal(selected.length,6);assert.ok(selected.includes(tech));
});

test('one reviewed publisher fills unused capacity without admitting duplicate or previous URLs',()=>{
  const records=Array.from({length:6},(_,i)=>({...record,url:record.url.replace('1234567',String(1234590+i)),title:'Indonesia parliament discusses education',description:'Indonesia parliament discussed education policy.'}));
  const prior=records[0].url;
  const selected=shortlist([...records,records[1]],records.map(r=>({normalizedUrl:r.url})),[prior]);
  assert.equal(selected.length,5);assert.equal(new Set(selected.map(r=>r.url)).size,5);assert.ok(!selected.some(r=>r.url===prior));
  const rejected={...records[5],url:records[5].url.replace('1234595','1234599')};
  assert.ok(!shortlist([rejected,...records],records.map(r=>({normalizedUrl:r.url})),[]).includes(rejected));
});
test('publisher diversity is preferred before same-publisher fallback',()=>{
  const records=Array.from({length:5},(_,i)=>({...record,url:record.url.replace('1234567',String(1234600+i)),title:'Indonesia parliament discusses education',description:'Indonesia parliament discussed education policy.'}));
  const third={...record,url:'https://vietnamnews.vn/economy/12345/indonesia-education.html',feedId:'vietnam-news-economy',title:'Indonesia education policy discussed',description:'Indonesia education policy was discussed at a meeting.'};
  const selected=shortlist([...records,third],[...records,third].map(r=>({normalizedUrl:r.url})),[]);
  assert.equal(selected.length,6);assert.ok(selected.includes(third));
});
test('private discovery ranks independent originals without leaking candidate text into inference',async()=>{
 const h=harness(),infer=h.options.infer;
 h.options.discover=async()=>({report:{feeds:[],candidates:[{url:record.url,title:'UNTRUSTED_DISCOVERY_ONLY_MARKER',publishedAt:'2100-01-01'}]},alerts:{configured:false,candidates:[]}});
 h.options.infer=async(request,...args)=>{assert.ok(!request.input.includes('UNTRUSTED_DISCOVERY_ONLY_MARKER'));assert.ok(!request.input.includes('2100-01-01'));return infer(request,...args);};
 try{await produce(h.options);assert.equal(h.calls(),2);assert.equal(h.objects.get('evidence/candidate-bridge-trial-aaaaaaaaaaaa-2026-10-11.json').value.directMatches,1);}
 finally{h.cleanup();}
});
test('declared editions normalize Indonesian punctuation without changing literal quotes', () => {
  const {canonicalNumbers,eventScope}=require('../scripts/daily-news.cjs');
  assert.equal(canonicalNumbers('1.222 households, 1,5 percent','id-ID'),'1222 households, 1.5 percent');
  assert.equal(canonicalNumbers('1,222 households, 1.5 percent'),'1222 households, 1.5 percent');
  const flood=extractRssEvidence({...record,title:'Indonesia flood displaces 1.222 households',description:'Indonesia reports flooding displaced 1.222 households after heavy rain.'});
  const item={sourceIds:[flood.id],editions:['indonesia'],en:{title:'Indonesia reports flooding',summary:'Flooding displaced 1,222 households in Indonesia.'},jp:{title:'インドネシアの洪水被害',summary:'インドネシアの洪水で1222世帯が避難した。'},quotes:[{sourceId:flood.id,text:'Indonesia reports flooding displaced 1.222 households after heavy rain.'}]};
  assert.equal(validateEvents([item],[flood]).length,1);
  const bad=copy(item);bad.en.summary=bad.en.summary.replace('1,222','1.222');bad.jp.summary=bad.jp.summary.replace('1222','1.222');
  assert.throws(()=>validateEvents([bad],[flood]),/unsupported_number/);
  assert.deepEqual(eventScope({...event,editions:['indonesia']},[source]),{indonesia:true,tech:false});
  assert.throws(()=>eventScope({...event,editions:['tech']},[source]),/invalid_edition_membership/);
  const bundle={schemaVersion:4,editionDate:'2026-10-11',revision:'a'.repeat(40),sources:[flood],events:[item],review:{approved:true,checkedIds:[flood.id]},files:renderDailyEditions('2026-10-11',[item],[flood])};
  assert.equal(Object.keys(validateBundle(bundle,'2026-10-11')).length,2);
  assert.throws(()=>validateBundle({...bundle,schemaVersion:3},'2026-10-11'));
});
test('failure status exposes only bounded transport codes and distinguishes no news',()=>{
  const {dailyFailure}=require('../scripts/daily-news.cjs');
  const {generationStatus}=require('../scripts/publish-news-bundle.cjs');
  const {safePlanFailure}=require('../scripts/chatgpt-plan.cjs');
  const safe=safePlanFailure({code:'inference_failed',phase:'inference',httpStatus:429,upstreamCode:'subscription_sharing_usage_limit_exceeded',message:'private arbitrary payload'});
  assert.deepEqual(safe,{code:'inference_failed',phase:'inference',upstreamCode:'subscription_sharing_usage_limit_exceeded',httpStatus:429});
  assert.equal(JSON.stringify(dailyFailure(Object.assign(new Error('private arbitrary payload'),{planError:{code:'private arbitrary payload',upstreamCode:'private arbitrary payload'}}),'review')).includes('private arbitrary payload'),false);
  assert.throws(()=>generationStatus({schemaVersion:1,editionDate:'2026-10-14',status:'failed'},'2026-10-14'),/daily_generation_failed/);
  assert.equal(generationStatus({schemaVersion:1,editionDate:'2026-10-14',status:'no_news'},'2026-10-14').status,'no_news');
  assert.throws(()=>generationStatus({schemaVersion:1,editionDate:'2026-10-13',status:'no_news'},'2026-10-14'),/invalid_generation_status/);
});
test('twenty stories per topic render, twenty-one fail, and shared events consume both caps',()=>{
  const {capacityFixture}=require('./fixtures/daily-capacity.cjs');
  const f=capacityFixture(),date='2026-10-14';
  const files=renderDailyEditions(date,f.events,f.sources);
  assert.equal(Object.keys(files).length,4);
  for(const content of Object.values(files))assert.equal((content.match(/^## .+ \{#news-/gm)||[]).length,20);
  const bundle={schemaVersion:4,editionDate:date,revision:'a'.repeat(40),sources:f.sources,events:f.events,review:{approved:true,checkedIds:f.sources.map(s=>s.id)},files};
  assert.deepEqual(validateBundle(bundle,date),files);
  const over=capacityFixture(21,19);assert.throws(()=>renderDailyEditions(date,over.events,over.sources),/edition_event_limit/);
  const shared={...event,editions:['indonesia','tech']};
  assert.throws(()=>renderDailyEditions(date,[...f.events,shared],[...f.sources,source]),/invalid_events/);
  assert.throws(()=>renderDailyEditions(date,[...f.events.slice(0,39),shared],[...f.sources,source]),/edition_event_limit/);
  assert.throws(()=>validateBundle({...bundle,schemaVersion:3},date),/invalid_publication_bundle/);
  assert.ok(Buffer.byteLength(JSON.stringify(bundle))<1048576);
});
test('forty-source generation and review fit bounded requests without additional model calls',async()=>{
  const {capacityFixture}=require('./fixtures/daily-capacity.cjs'),f=capacityFixture();
  for(const source of f.sources){source.excerpt=source.excerpt.padEnd(1600,'x');source.excerptHash=require('node:crypto').createHash('sha256').update(source.excerpt).digest('hex');}
  for(const event of f.events){event.en.title=event.en.title.padEnd(100,'x');event.jp.title=event.jp.title.padEnd(100,'字');event.en.summary=event.en.summary.padEnd(400,'x');event.jp.summary=event.jp.summary.padEnd(180,'字');event.quotes[0].text=f.sources.find(s=>s.id===event.sourceIds[0]).excerpt.slice(0,250);}
  const h=harness({records:f.records});let calls=0;
  h.options.body=async record=>f.sources.find(s=>s.url===record.url);
  h.options.infer=async(request,credential,output)=>{calls++;assert.ok(Buffer.byteLength(request.input)+Buffer.byteLength(request.instructions)<196608);const input=JSON.parse(request.input);assert.equal(input.sources.length,40);fs.writeFileSync(output,JSON.stringify({text:JSON.stringify(calls===1?{events:f.events}:{approved:true,checkedIds:f.sources.map(s=>s.id)})}));return {valid:true};};
  try{const result=await produce({...h.options,instant:new Date('2026-10-14T00:30:00Z'),replayDate:'2026-10-14'});assert.equal(result.events,40);assert.equal(calls,2);}finally{h.cleanup();}
});
test('large single-publisher candidate pools respect total cap and preserve both topic reservations',()=>{
  const {capacityFixture}=require('./fixtures/daily-capacity.cjs'),f=capacityFixture(45,45);
  const selected=shortlist(f.records,f.records.map(r=>({normalizedUrl:r.url})),[]);
  assert.equal(selected.length,40);
  assert.equal(selected.filter(r=>r.title.startsWith('Indonesia')).length,20);
  assert.equal(selected.filter(r=>r.title.startsWith('Vietnam')).length,20);
});
