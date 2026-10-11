const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { subjectLabels, sourceInfo, noteMetadata } = require('../scripts/news-ui.cjs');
test('Publisher nationality does not determine subject filters', () => {
  assert.equal(sourceInfo('https://www.cabis.gov.cn/news/a').country, 'CN');
  assert.deepEqual(subjectLabels('ASEAN AI cooperation with Indonesia').countries, ['SEA', 'ID']);
  assert.equal(sourceInfo('https://unknown.cn/news'), null);
  assert.equal(sourceInfo('https://user:password@www.cabis.gov.cn/news'), null);
  const event = { en: { title: 'Vietnam ecommerce', summary: 'A market update' }, jp: { title: '見出し', summary: '要約' }, sourceIds: ['a','b'] };
  const sources = [{ id:'a', url:'https://example.com/a' },{ id:'b', url:'https://example.com/b' }];
  assert.deepEqual(noteMetadata(event,sources,'en').countries, noteMetadata(event,sources,'jp').countries);
  assert.equal(noteMetadata(event,sources,'jp').sourceUrls.length, 2);
});
test('Combined country, topic and text filters update accessible count safely', () => {
  const events = {}; const form = { hidden:true, elements:{ query:{value:''},country:{value:''},topic:{value:''} },addEventListener:(key,fn)=>{events[key]=fn;} };
  const cards = [{textContent:'Vietnam AI update',dataset:{countries:'VN',topics:'ai',search:'Vietnam AI update with detailed policy discussion'}},{textContent:'Indonesia ecommerce',dataset:{countries:'ID',topics:'ecommerce'}}];
  const status={dataset:{template:'{count} results'}};
  vm.runInNewContext(fs.readFileSync('assets/js/news-filters.js','utf8'), {document:{querySelector:s=>s.includes('filters')?form:status,querySelectorAll:()=>cards}});
  assert.equal(form.hidden,false); assert.equal(status.textContent,'2 results');
  form.elements.country.value='VN';form.elements.topic.value='ecommerce'; events.change(); assert.equal(status.textContent,'0 results');
  form.elements.topic.value='ai';events.input(); assert.equal(status.textContent,'1 results');
  form.elements.query.value='detailed policy';events.input();assert.equal(status.textContent,'1 results');
  form.elements.query.value='<img onerror=alert(1)>'; events.input(); assert.equal(status.textContent,'0 results');
});
