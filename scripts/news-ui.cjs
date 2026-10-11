const metadata = require('../data/news_sources.json');
const { sourcePolicy } = require('./news-source-policy.cjs');
const countries = {
  SEA: /ASEAN|Southeast Asia|東南アジア/i,
  ID: /\bIndonesia(?:n)?\b|インドネシア/i, VN: /\bViet(?:nam(?:ese)?| Nam)\b|ベトナム/i,
  SG: /\bSingapore(?:an)?\b|シンガポール/i, MY: /\bMalaysia(?:n)?\b|マレーシア/i,
  TH: /\bThailand|\bThai\b|タイ/i, PH: /\bPhilippines|\bFilipino\b|フィリピン/i,
  KH: /\bCambodia(?:n)?\b|カンボジア/i, LA: /\bLaos?\b|ラオス/i,
  MM: /\bMyanmar\b|ミャンマー/i, BN: /\bBrunei\b|ブルネイ/i, TL: /\bTimor\b|東ティモール/i,
};
const topics = {
  ai: /\bAI\b|artificial intelligence|人工知能/i,
  ecommerce: /e-?commerce|online export|電子商取引|越境EC|\bEC\b|小売|retail/i,
  infrastructure: /data cent|cloud|connectivity|データセンター|クラウド|通信|基盤/i,
  payments: /payment|fintech|決済|金融/i, policy: /regulat|copyright|policy|政策|規制|著作権/i,
  security: /cyber|security|サイバー|セキュリティ/i,
};
function subjectLabels(value) {
  const text = value.normalize('NFKD').replace(/(\p{Script=Latin})\p{M}+/gu, '$1').normalize('NFC');
  return { countries: Object.entries(countries).filter(([, re]) => re.test(text)).map(([id]) => id),
    topics: Object.entries(topics).filter(([, re]) => re.test(text)).map(([id]) => id) };
}
function sourceInfo(value) {
  try { const url = new URL(value);return url.protocol === 'https:' && !url.username && !url.password && !url.port ? metadata[url.hostname] || null : null; }
  catch { return null; }
}
function noteMetadata(event, sources, language) {
  // Classify subject labels once from English so both languages share identical filters.
  return { title: event[language].title, summary: event[language].summary,
    ...subjectLabels(event.en.title + ' ' + event.en.summary),
    sourceUrls: event.sourceIds.map(id => sources.find(source => source.id === id).url),
    attributions: event.sourceIds.flatMap(id => {
      const source = sources.find(item => item.id === id), policy = sourcePolicy(source)?.source;
      return policy?.licenseUrl ? [{ creator: source.creator, publisher: policy.name, licenseUrl: policy.licenseUrl, licenseLabel: policy.licenseLabel }] : [];
    }) };
}
module.exports = { subjectLabels, sourceInfo, noteMetadata };
