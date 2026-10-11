const topic = /\b(?:AI|digital|technology|tech|cyber|teknologi|siber|internet|startup|e-commerce|ecommerce|fintech|data|shopee|tokopedia|lazada|grab|gojek|semiconductor|semikonduktor|komdigi|software|cloud|payments)\b|デジタル|電子商取引|人工知能|サイバー|スタートアップ|半導体|データ|決済|通信|DX/i;
const region = /\b(?:ASEAN|Southeast Asia|South-East Asia|Indonesia|Indonesian|Vietnam|Viet Nam|Vietnamese|Singapore|Singaporean|Malaysia|Malaysian|Thailand|Thai|Philippines|Filipino|Cambodia|Cambodian|Laos|Lao|Myanmar|Burmese|Brunei|Timor|Jakarta|Hanoi|Manila|Bangkok)\b|東南アジア|インドネシア|ベトナム|シンガポール|マレーシア|タイ|フィリピン|カンボジア|ラオス|ミャンマー|ブルネイ|東ティモール/i;
function relevantNews(value) {
  const text = value.normalize('NFKD').replace(/(\p{Script=Latin})\p{M}+/gu, '$1').normalize('NFC');
  return topic.test(text) && region.test(text);
}
module.exports = { relevantNews };
