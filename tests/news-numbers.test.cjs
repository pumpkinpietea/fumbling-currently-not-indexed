const { test } = require('node:test');
const assert = require('node:assert/strict');
const { numericFacts } = require('../scripts/news-numbers.cjs');
const { validateEvents } = require('../scripts/daily-news.cjs');
const { extractRssEvidence } = require('../scripts/news-evidence.cjs');
test('explicit cardinal words, month names, scales, denominators and on-hour clocks compare exactly', () => {
  for (const [en, jp, id] of [
    ['nine of 19 people', '19人のうち9人', 'sembilan dari 19 orang'],
    ['4 meters on October 15–18', '10月15～18日に4メートル', '4m 15-18 Oktober'],
    ['Rp2,561,000 per gram, down Rp13,000', '1グラム256万1,000ルピア、1万3,000下落', 'Rp13.000 jadi Rp2,561 juta/gr'],
    ['Rp2,565,000 per gram at 09:00', '1グラム2,565,000ルピア、午前9時', 'Rp2,565 juta per gram pukul 09.00'],
    ['1.25 billion and 2.56 million', '12億5000万と256万', '1,25 miliar dan 2,56 juta'],
  ]) {
    assert.deepEqual(numericFacts(en), numericFacts(jp));
    assert.deepEqual(numericFacts(en), numericFacts(id, 'id-ID'));
  }
});
test('scale arithmetic preserves precision and rejects genuinely different values and times', () => {
  assert.deepEqual(numericFacts('9007199254740993 million'), ['9007199254740993000000']);
  assert.deepEqual(numericFacts('1.0000001 million'), ['1000000.1']);
  for (const [a,b] of [['1.222 households','1,222 households'],['2.565 million','2.565 billion'],['09:30','午前9時'],['nine of 19','8人と19人']]) assert.notDeepEqual(numericFacts(a),numericFacts(b));
});
test('ambiguous punctuation and named initiatives are not silently interpreted as quantities', () => {
  assert.deepEqual(numericFacts('One Data law may help'),[]);
  assert.deepEqual(numericFacts('UU Satu Data','id-ID'),[]);
  assert.notDeepEqual(numericFacts('2.5.6'),numericFacts('2.5'));
  assert.throws(()=>numericFacts('1万2億'),/unsupported_number/);
  assert.deepEqual(numericFacts('09:30'),numericFacts('9時30分'));
});
test('schema4 accepts lexical equivalence but rejects unsupported values and keeps legacy behavior', () => {
  const source = extractRssEvidence({url:'https://www.antaranews.com/berita/1234567/indonesia-kpk',title:'KPK Indonesia bawa sembilan orang',publishedAt:'2026-10-16T02:00:00Z',description:'KPK Indonesia membawa sembilan dari 19 orang dari Klaten ke Jakarta.'});
  const event={editions:['indonesia'],sourceIds:[source.id],en:{title:'Indonesia KPK transfers nine people',summary:'KPK transferred nine of 19 people from Klaten to Jakarta.'},jp:{title:'インドネシアKPK、9人を移送',summary:'KPKは19人のうち9人をクラテンからジャカルタへ移送した。'},quotes:[{sourceId:source.id,text:'KPK Indonesia membawa sembilan dari 19 orang'}]};
  assert.equal(validateEvents([event],[source]).length,1);
  const bad=structuredClone(event);bad.jp.summary=bad.jp.summary.replace('9人を','8人を');assert.throws(()=>validateEvents([bad],[source]),/translation_number_conflict/);
  const unsupported=structuredClone(event);unsupported.en.summary+=' There were 25 others.';unsupported.jp.summary+='他に25人。';assert.throws(()=>validateEvents([unsupported],[source]),/unsupported_number/);
  const legacy=structuredClone(event);delete legacy.editions;assert.throws(()=>validateEvents([legacy],[source]),/translation_number_conflict/);
});

test('explicit English/Indonesian ordinal day counts match Japanese digits without treating seconds as ordinals',()=>{
  assert.deepEqual(numericFacts('second day: 9 victories'),numericFacts('2日目に9勝'));
  assert.deepEqual(numericFacts('hari kedua dengan sembilan kemenangan','id-ID'),['2','9']);
  assert.deepEqual(numericFacts('a second response'),[]);
  assert.notDeepEqual(numericFacts('third day'),numericFacts('2日目'));
});

test('rank ordinals and trillion quantities match October19 evidence without broad ordinal guessing',()=>{
 assert.deepEqual(numericFacts('posisi kedua Moto3 Junior 2026','id-ID'),numericFacts('2nd place Moto3 Junior 2026'));
 assert.deepEqual(numericFacts('runner-up in Misano'),['2']);
 assert.deepEqual(numericFacts('second place'),['2']);
 assert.deepEqual(numericFacts('kedua negara','id-ID'),[]);
 assert.deepEqual(numericFacts('second response'),[]);
 assert.notDeepEqual(numericFacts('posisi ketiga','id-ID'),['2']);
 assert.deepEqual(numericFacts('Rp225 triliun','id-ID'),numericFacts('225,000,000,000,000 rupiah'));
 assert.deepEqual(numericFacts('1,25 triliun','id-ID'),numericFacts('1.25 trillion'));
 assert.deepEqual(numericFacts('225兆'),numericFacts('225 trillion'));
 assert.deepEqual(numericFacts('1兆2500億'),numericFacts('1,250,000,000,000'));
 assert.throws(()=>numericFacts('1億2兆'),/unsupported_number/);
});

test('month-only dates, exchange-rate denominators and medal ordinals retain equivalence',()=>{
 assert.deepEqual(numericFacts('November summit'),numericFacts('11月の首脳会議'));
 assert.deepEqual(numericFacts('projects in September'),numericFacts('9月の事業'));
 assert.deepEqual(numericFacts('KTT ASEAN November','id-ID'),['11']);
 assert.deepEqual(numericFacts('Rp17,992 per US dollar'),numericFacts('1米ドル＝Rp17,992'));
 assert.deepEqual(numericFacts('Nilai tukar rupiah terhadap dolar AS Rp17.992','id-ID'),['1','17992']);
 assert.deepEqual(numericFacts('emas kedelapan','id-ID'),numericFacts('8th gold'));
 assert.deepEqual(numericFacts('perak ketiga','id-ID'),['3']);
 assert.deepEqual(numericFacts('May improve; march forward; kedua negara'),[]);
 assert.deepEqual(numericFacts('US dollar demand'),[]);
 assert.deepEqual(numericFacts('in May'),['5']);
 assert.notDeepEqual(numericFacts('8th gold'),numericFacts('emas ketujuh','id-ID'));
});

test('schema 8 milestone ordinals preserve the JETRO first-strategy meaning without changing legacy numbers',()=>{
 const options={milestones:true};
 for(const [en,jp]of [['1st national semiconductor strategy','初の国家半導体戦略'],['first national semiconductor strategy','初の国家半導体戦略'],['first national plan','初の国家計画'],['second national strategy','第2の国家戦略']])assert.deepEqual(numericFacts(en,'en',options),numericFacts(jp,'en',options));
 assert.deepEqual(numericFacts('初の国家半導体戦略'),[]);
 assert.deepEqual(numericFacts('first national semiconductor strategy'),[]);
 assert.deepEqual(numericFacts('first aid, first class, a second response; 初の訪問','en',options),[]);
 assert.notDeepEqual(numericFacts('2nd national semiconductor strategy','en',options),numericFacts('初の国家半導体戦略','en',options));
 assert.notDeepEqual(numericFacts('first national strategy','en',options),numericFacts('初の国家戦略と2工場','en',options));
});
