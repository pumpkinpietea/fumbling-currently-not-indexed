const {extractRssEvidence}=require('../../scripts/news-evidence.cjs');
function capacityFixture(indonesia=20,tech=20){
  const records=[],sources=[],events=[];
  for(const [topic,count] of [['indonesia',indonesia],['tech',tech]])for(let i=0;i<count;i++){
    const country=topic==='indonesia'?'Indonesia':'Vietnam',number=i+1;
    const title=`${country} ${topic==='indonesia'?'education policy':'semiconductor cooperation'} update ${number}`;
    const record={url:topic==='indonesia'?`https://www.antaranews.com/berita/${9000000+i}/synthetic-policy-${number}`:`https://vietnamnews.vn/economy/${9000000+i}/synthetic-semiconductor-${number}.html`,title,publishedAt:'2026-10-13T04:00:00Z',description:`${title}. This synthetic fixture describes a proposal discussed by officials.`,...(topic==='tech'?{feedId:'vietnam-news-economy'}:{})};
    const source=extractRssEvidence(record);records.push(record);sources.push(source);
    events.push({editions:[topic],sourceIds:[source.id],en:{title,summary:`${country} officials discussed ${topic==='indonesia'?'an education policy':'semiconductor cooperation'} proposal ${number}.`},jp:{title:`${topic==='indonesia'?'インドネシアの教育政策':'ベトナムの半導体協力'}の提案 ${number}`,summary:`${topic==='indonesia'?'インドネシア':'ベトナム'}の当局者は提案${number}について協議した。`},quotes:[{sourceId:source.id,text:title}]});
  }
  return {records,sources,events};
}
module.exports={capacityFixture};
