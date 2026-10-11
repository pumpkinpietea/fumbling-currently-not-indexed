const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseRss, publicationTime } = require('../scripts/rss-metadata.cjs');
const { dailyFeeds } = require('../scripts/news-source-policy.cjs');
const { extractRssEvidence } = require('../scripts/news-evidence.cjs');
const { validRequest } = require('../scripts/collect-feeds.cjs');
const china = { localDateOffsetMinutes: 480, httpsArticleHost: 'www.ecns.cn', includeDescription: true };
test('China-local dates require the ECNS adapter and reject invalid calendar values', () => {
  assert.equal(publicationTime('2026-10-10 00:30:00'), null);
  assert.equal(publicationTime('2026-10-10 00:30:00', china), '2026-10-09T16:30:00Z');
  assert.equal(publicationTime('2024-02-29 08:00:00', china), '2024-02-29T00:00:00Z');
  for (const value of ['2026-02-29 08:00:00','2026-13-10 08:00:00','2026-10-32 08:00:00','2026-10-10 24:00:00','2026-10-10','2026-10-10 08:00:00 CST'])
    assert.equal(publicationTime(value, china), null);
});
test('only explicit ECNS HTTP links upgrade to HTTPS, retaining original date evidence', () => {
  const make = url => Buffer.from(`<rss version="2.0"><channel><item><title>Indonesia expands digital services across industry</title><link>${url}</link><pubDate>2026-10-10 11:00:00</pubDate><description>Indonesia announced a new digital services initiative for its industries.</description></item></channel></rss>`);
  const url = 'http://www.ecns.cn/cns-wire/2026-10-10/detail-abcdef123.shtml';
  const record = parseRss(make(url), china).records[0];
  assert.equal(record.url, url.replace('http:', 'https:'));
  assert.deepEqual(record.publicationDatesRaw, ['2026-10-10 11:00:00']);
  assert.equal(record.publishedAt, '2026-10-10T03:00:00Z');
  assert.equal(extractRssEvidence({ ...record, feedId: 'ecns-news' }).publisher, 'ECNS (China News Service)');
  assert.equal(parseRss(make(url), { includeDescription: true }).records[0].url, url);
  for (const bad of [url.replace('www.ecns.cn', 'other.example'), url.replace('www.ecns.cn', 'www.ecns.cn:8080'), url.replace('http:', 'ftp:')]) {
    const r = parseRss(make(bad), china).records[0];assert.equal(r.url, bad);
    assert.throws(() => extractRssEvidence({ ...r, feedId: 'ecns-news' }));
  }
});
test('Chinese and Middle Eastern provenance stays isolated within collection limits', () => {
  assert.ok(dailyFeeds.includes('ecns-news') && dailyFeeds.includes('mehr-news'));
  const record = { feedId: 'mehr-news', url: 'https://en.mehrnews.com/news/123456/Indonesia-digital-services',
    title: 'Indonesia expands digital services initiative', description: 'Indonesia announced a digital services initiative for its industries.', publishedAt: '2026-10-10T03:00:00Z' };
  assert.equal(extractRssEvidence(record).publisher, 'Mehr News Agency');
  assert.throws(() => extractRssEvidence({ ...record, feedId: 'ecns-news' }));
  assert.throws(() => extractRssEvidence({ ...record, url: record.url.replace('/news/', '/opinion/') }));
  const window = { start: '2026-10-09T17:00:00Z', end: '2026-10-10T17:00:00Z' };
  assert.equal(validRequest({ schemaVersion: 1, window, feeds: dailyFeeds }), true);
  assert.equal(validRequest({ schemaVersion: 1, window, feeds: [...dailyFeeds, 'ecns-news'] }), false);
});
