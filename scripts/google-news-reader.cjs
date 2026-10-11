const { parseRss } = require('./rss-metadata.cjs');
const { fetchFeed } = require('./feed-transport.cjs');
const { relevantNews } = require('./news-relevance.cjs');
const region = '(Indonesia OR ASEAN OR "Southeast Asia" OR Vietnam OR Singapore OR Malaysia OR Thailand OR Philippines)';
const topic = '(technology OR digital OR AI OR ecommerce OR "e-commerce" OR fintech OR "data centre")';
const queries = Object.freeze([
  { id: 'sea-tech', query: `${region} ${topic} when:2d` },
  { id: 'china-middle-east-sea-tech', query: `(Indonesia OR (${region} ${topic})) (site:ecns.cn OR site:chinadaily.com.cn OR site:cgtn.com OR site:aljazeera.com OR site:en.mehrnews.com OR site:arabnews.com) when:2d` },
  { id: 'indonesia-general', query: '(Indonesia OR Indonesian OR Jakarta) when:2d' },
  { id: 'yahoo-indonesia-ja', hl: 'ja', gl: 'JP', ceid: 'JP:ja', query: '(インドネシア OR ジャカルタ) site:news.yahoo.co.jp when:2d' },
]);
const locales = Object.freeze([
  { id: 'id', hl: 'id', gl: 'ID', ceid: 'ID:id', query: '(Indonesia OR ASEAN OR Asia Tenggara) (teknologi OR digital OR AI OR e-commerce) when:2d' },
  { id: 'ja', hl: 'ja', gl: 'JP', ceid: 'JP:ja', query: '(東南アジア OR インドネシア OR ベトナム) (IT OR EC OR デジタル OR 人工知能) when:2d' },
  { id: 'vi', hl: 'vi', gl: 'VN', ceid: 'VN:vi', query: '(Việt Nam OR Indonesia OR ASEAN) (công nghệ OR thương mại điện tử OR AI) when:2d' },
  { id: 'th', hl: 'th', gl: 'TH', ceid: 'TH:th', query: '(อาเซียน OR อินโดนีเซีย OR เวียดนาม) (เทคโนโลยี OR ดิจิทัล OR AI) when:2d' },
  { id: 'zh', hl: 'zh-CN', gl: 'CN', ceid: 'CN:zh-Hans', query: '(印尼 OR 东南亚 OR 越南 OR 东盟) (科技 OR 电商 OR 人工智能) when:2d' },
  { id: 'ar', hl: 'ar', gl: 'QA', ceid: 'QA:ar', query: '(إندونيسيا OR فيتنام OR آسيان) (التكنولوجيا OR التجارة الإلكترونية OR الذكاء الاصطناعي) when:2d' },
]);
function dailyQueries(instant) {
  const day = Math.floor((instant.getTime() + 25200000) / 86400000);
  return [...queries, { ...locales[day % locales.length], id: 'local-' + locales[day % locales.length].id }];
}
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
function candidate(record) {
  try {
    const url = new URL(record.url);
    return url.protocol === 'https:' && url.hostname === 'news.google.com' && !url.username && !url.password && !url.port &&
      /^\/rss\/articles\/[a-zA-Z0-9_-]+$/.test(url.pathname) && !url.hash &&
      typeof record.title === 'string' && relevantNews(record.title) && Number.isFinite(Date.parse(record.publishedAt));
  } catch { return false; }
}
async function readGoogleNews({ fetch = fetchFeed, now = () => new Date() } = {}) {
  const report = { schemaVersion: 1, purpose: 'private_personal_noncommercial_reader',
    collectedAt: now().toISOString(), dateMeaning: 'Google feed timestamp; original publication unverified', feeds: [], candidates: [] };
  const seen = new Set();
  for (const query of dailyQueries(now())) {
    const url = new URL('https://news.google.com/rss/search');
    url.search = new URLSearchParams({ q: query.query, hl: query.hl || 'en-US', gl: query.gl || 'US', ceid: query.ceid || 'US:en' }).toString();
    try {
      const parsed = parseRss(await fetch(url.href));
      if (!parsed.valid) throw new Error('invalid_feed');
      report.feeds.push({ id: query.id, status: 'ok', itemCount: parsed.records.length });
      let queryCandidates = 0;
      for (const record of parsed.records) {
        if (!candidate(record) || seen.has(record.url) || report.candidates.length >= 150 || queryCandidates >= 30 || record.url.length > 2048 || record.title.length > 500) continue;
        seen.add(record.url);queryCandidates++;report.candidates.push({ queryId: query.id, title: record.title,
          googleUrl: record.url, googleFeedTimestamp: record.publishedAt, originalVerified: false });
      }
    } catch { report.feeds.push({ id: query.id, status: 'failed', itemCount: 0 }); }
  }
  const html = '<!doctype html><html lang="ja"><meta charset="utf-8"><title>個人用ニュース候補</title>' +
    '<h1>インドネシア全般・東南アジアIT：個人用候補リーダー</h1><p>Google News RSS。非公開・非商用の個人閲覧用。日時はGoogle配信日時です。原典未確認・公開記事の根拠には未採用。</p><ul>' +
    report.candidates.map(c => `<li><a href="${escape(c.googleUrl)}" target="_blank" rel="noopener noreferrer">${escape(c.title)}</a> <time>${escape(c.googleFeedTimestamp)}</time></li>`).join('') + '</ul></html>';
  return { report, html };
}
module.exports = { readGoogleNews, candidate, queries, dailyQueries };
if (require.main === module) {
  const fs = require('node:fs'), path = require('node:path');
  const directory = process.argv.length === 3 ? process.argv[2] : null;
  (async () => {
    if (!directory) throw new Error('output_directory_required');
    fs.mkdirSync(directory, { mode: 0o700 });
    const reader = await readGoogleNews();
    fs.writeFileSync(path.join(directory, 'report.json'), JSON.stringify(reader.report, null, 2), { flag: 'wx', mode: 0o600 });
    fs.writeFileSync(path.join(directory, 'index.html'), reader.html, { flag: 'wx', mode: 0o600 });
    console.log(JSON.stringify({ feeds: reader.report.feeds, candidates: reader.report.candidates.length }));
  })().catch(() => { console.log(JSON.stringify({ status: 'reader_failed' }));process.exitCode = 1; });
}
