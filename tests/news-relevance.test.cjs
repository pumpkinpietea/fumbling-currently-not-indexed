const {test}=require('node:test');
const assert=require('node:assert/strict');
const {relevantIndonesia,relevantTech,relevantNews}=require('../scripts/news-relevance.cjs');
const {shortlist}=require('../scripts/daily-news.cjs');
test('multilingual technology/place aliases reach review without admitting unrelated world coverage',()=>{
 for(const title of ['Vietnam expands telecom services','Viet Nam opens data centres','Việt Nam phát triển phần mềm và điện toán đám mây','Đông Nam Á phát triển viễn thông','Indonesia memperkuat perdagangan elektronik dan pembayaran','RI kembangkan pusat data','ベトナムでクラウドとソフトウェア事業を拡大','インドネシアのスマートフォン市場が成長','中国企业在越南发展电子商务'])assert.equal(relevantTech(title),true,title);
 for(const title of ['RI kirim bantuan banjir','Bandung reports flood damage','バリ島の災害対応','West Java authorities report flood damage'])assert.equal(relevantIndonesia(title),true,title);
 for(const title of ['China expands telecom services','Japan develops software','Java software update in Canada','Canada opens semiconductor plant','ASEAN ministers discuss trade management','China-Laos Railway passenger numbers grow','Vietnam airline wins ESG award'])assert.equal(relevantTech(title),false,title);
 assert.equal(relevantNews('China railway passenger growth'),false);
});
test('title-only institutions cannot reserve a topic slot using an excluded description; audit separates history and selection',()=>{
 const r={feedId:'jetro-biznews-ja',url:'https://www.jetro.go.jp/biznews/2026/10/1234567890abcdef.html',title:'ASEAN countries announce general regional economic trade policy coordination',description:'Vietnam cloud software services',publishedAt:'2026-10-10T10:00:00Z'};
 const audit={};assert.equal(shortlist([r],[{normalizedUrl:r.url}],[],[],audit).length,0);
 const a={feedId:'antara-top-news',url:'https://www.antaranews.com/berita/1234567/indonesia-cloud',title:'Indonesia expands cloud services',description:'Indonesia announced cloud service expansion.',publishedAt:r.publishedAt};const stats={};assert.equal(shortlist([a],[{normalizedUrl:a.url}],[],[],stats).length,1);assert.equal(stats.antara.selected,1);const prior={};shortlist([a],[{normalizedUrl:a.url}],[a.url],[],prior);assert.equal(prior.antara.historyOrDuplicate,1);
});
