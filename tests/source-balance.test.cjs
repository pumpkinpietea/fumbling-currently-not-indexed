const {test}=require('node:test'),assert=require('node:assert/strict');
const {shortlist}=require('../scripts/daily-news.cjs');
const {publisherGroup}=require('../scripts/news-source-policy.cjs');
const {capacityFixture}=require('./fixtures/daily-capacity.cjs');
function yahoo(provider,index,tech=false){return {feedId:'yahoo-world',url:'https://news.yahoo.co.jp/articles/'+index.toString(16).padStart(40,'0'),title:`インドネシアの${tech?'半導体事業':'教育政策'}に関する新計画を発表（${provider}）`,description:`インドネシアの当局者は${tech?'半導体事業':'教育政策'}に関する新計画について説明し、関係機関と協議した。`,publishedAt:'2026-10-13T04:00:00Z'};}
function select(records){return shortlist(records,records.map(r=>({normalizedUrl:r.url})),[]);}
function counts(records){const result={};for(const r of records){const key=publisherGroup(r);result[key]=(result[key]||0)+1;}return result;}
test('original publisher groups normalize Yahoo credit and unify direct reviewed publishers',()=>{
  const direct=capacityFixture(1,1).records;
  assert.equal(publisherGroup(yahoo('ＡＮＴＡＲＡ',1)),publisherGroup(direct[0]));
  assert.equal(publisherGroup(yahoo('アンタラ通信',2)),publisherGroup(direct[0]));
  assert.equal(publisherGroup(yahoo('Viet Nam News',3)),publisherGroup(direct[1]));
  assert.notEqual(publisherGroup(yahoo('共同通信',4)),publisherGroup(yahoo('時事通信',5)));
  assert.equal(publisherGroup({...yahoo('共同通信',4),title:'インドネシアの新計画を発表'}),null);
});
test('first topic reservation spreads five each before admitting dominant-publisher overflow',()=>{
  const dominant=capacityFixture(30,0).records;
  const alternatives=['Synthetic B','Synthetic C','Synthetic D'].flatMap((name,i)=>Array.from({length:5},(_,j)=>yahoo(name,100+i*10+j)));
  const result=select([...dominant,...alternatives]);
  assert.equal(result.length,40);
  const first=Object.values(counts(result.slice(0,20)));
  assert.equal(first.length,4);assert.ok(first.every(value=>value===5));
});
test('soft target permits overflow after suitable alternative candidates are exhausted',()=>{
  const dominant=capacityFixture(25,0).records;
  const result=select([...dominant,yahoo('Synthetic B',1),yahoo('Synthetic B',2)]).slice(0,20);
  assert.equal(result.length,20);assert.equal(counts(result).antara,18);
  assert.equal(select(dominant).slice(0,20).length,20);
});
test('Yahoo copies do not create extra groups for a dominant direct publisher',()=>{
  const direct=capacityFixture(5,0).records;
  const distributed=Array.from({length:20},(_,i)=>yahoo('ANTARA',100+i));
  const others=['Synthetic B','Synthetic C','Synthetic D'].flatMap((p,i)=>Array.from({length:5},(_,j)=>yahoo(p,200+i*10+j)));
  const first=select([...direct,...distributed,...others]).slice(0,20);
  assert.equal(counts(first).antara,5);assert.ok(Object.values(counts(first)).every(n=>n===5));
});
test('topic reservations remain independent and fit the shared forty-source budget',()=>{
  const general=capacityFixture(30,0).records,tech=capacityFixture(0,30).records;
  const peers=['Synthetic B','Synthetic C','Synthetic D'].flatMap((p,i)=>Array.from({length:5},(_,j)=>(()=>{const record=yahoo(p,300+i*10+j,true);return {...record,title:record.title.replaceAll('インドネシア','ベトナム'),description:record.description.replaceAll('インドネシア','ベトナム')+'今後の対応方針も説明した。'};})()));
  const result=select([...general,...tech,...peers]);
  assert.equal(result.length,40);assert.equal(result.slice(0,20).every(r=>r.title.startsWith('Indonesia')),true);
  assert.ok(Object.values(counts(result.slice(20))).every(n=>n===5));
});
