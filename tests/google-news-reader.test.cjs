const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readGoogleNews, candidate } = require('../scripts/google-news-reader.cjs');
const { relevantNews } = require('../scripts/news-relevance.cjs');
const record = { title: 'Indonesia expands digital services - Synthetic Publisher', url: 'https://news.google.com/rss/articles/SyntheticArticle?oc=5', publishedAt: '2026-10-10T04:00:00Z' };
test('all publishers require both SEA geography and IT/e-commerce relevance', () => {
  for (const text of ['China reports Indonesia cloud investment', 'Iranian outlet reports ASEAN ecommerce growth', 'ベトナムのデジタル産業支援', 'Vietnam expands data centres']) assert.equal(relevantNews(text), true);
  for (const text of ['China semiconductor industry growth', 'Iran digital policy', 'Indonesia football results', 'ASEAN tourism festival']) assert.equal(relevantNews(text), false);
});
test('private candidate reader accepts only Google article links and explicit feed dates', () => {
  assert.equal(candidate(record), true);
  for (const patch of [{ url: 'https://evil.example/a' }, { url: 'javascript:alert(1)' }, { url: 'https://news.google.com@evil.example/rss/articles/a' }, { publishedAt: null }, { title: 'China cloud investment' }])
    assert.equal(candidate({ ...record, ...patch }), false);
});
test('reader bounds queries, deduplicates links, escapes markup and labels unverified dates', async () => {
  let calls = 0;
  const xml = Buffer.from(`<rss version="2.0"><channel><item><title><![CDATA[Indonesia digital & <script>synthetic</script>]]></title><link>${record.url.replace('&','&amp;')}</link><pubDate>Sat, 10 Oct 2026 04:00:00 GMT</pubDate></item></channel></rss>`);
  const reader = await readGoogleNews({ fetch: async url => { calls++;assert.equal(new URL(url).hostname, 'news.google.com');return xml; } });
  assert.equal(calls, 3);assert.equal(reader.report.candidates.length, 1);
  assert.equal(reader.report.candidates[0].originalVerified, false);
  assert.ok(reader.html.includes('&lt;script&gt;') && !reader.html.includes('<script>'));
  assert.ok(reader.html.includes('target="_blank" rel="noopener noreferrer"'));
});
test('discovery fetch failure is retained as private health without throwing', async () => {
  const reader = await readGoogleNews({ fetch: async () => { throw new Error('synthetic'); } });
  assert.deepEqual(reader.report.feeds.map(f => f.status), ['failed', 'failed', 'failed']);
  assert.equal(reader.report.candidates.length, 0);
});
