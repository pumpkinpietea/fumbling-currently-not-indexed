const topic = /\b(?:AI|digital|technology|tech|cyber|teknologi|siber|internet|startup|e-commerce|ecommerce|fintech|data|shopee|tokopedia|lazada|grab|gojek|semiconductor|semikonduktor|komdigi|software|cloud|payments)\b|\bIT\b|\bEC\b|thuong mai dien tu|cong nghe|tri tue nhan tao|ky thuat so|พาณิชย์อิเล็กทรอนิกส์|เทคโนโลยี|ปัญญาประดิษฐ์|ดิจิทัล|电商|电子商务|人工智能|数字|科技|التكنولوجيا|التجارة الإلكترونية|الذكاء الاصطناعي|デジタル|電子商取引|人工知能|サイバー|スタートアップ|半導体|データ|決済|通信|DX/i;
const region = /\b(?:ASEAN|Southeast Asia|South-East Asia|Indonesia|Indonesian|Vietnam|Viet Nam|Vietnamese|Singapore|Singaporean|Malaysia|Malaysian|Thailand|Thai|Philippines|Filipino|Cambodia|Cambodian|Laos|Lao|Myanmar|Burmese|Brunei|Timor|Jakarta|Hanoi|Manila|Bangkok)\b|Dong Nam A|Viet Nam|อินโดนีเซีย|เวียดนาม|อาเซียน|เอเชียตะวันออกเฉียงใต้|印度尼西亚|印尼|东南亚|东盟|越南|إندونيسيا|اندونيسيا|جنوب شرق آسيا|فيتنام|آسيان|東南アジア|インドネシア|ベトナム|シンガポール|マレーシア|タイ(?:の|で|に|が|は|と|を|向け|市場|政府|企業|経済|当局|、|：|\s|$)|フィリピン|カンボジア|ラオス|ミャンマー|ブルネイ|東ティモール/i;
function relevantNews(value) {
  const text = value.replace(/https?:\/\/\S+/gi, ' ').replace(/<[^>]*>/g, ' ').normalize('NFKD').replace(/(\p{Script=Latin})\p{M}+/gu, '$1').normalize('NFC');
  return topic.test(text) && region.test(text);
}
module.exports = { relevantNews };
