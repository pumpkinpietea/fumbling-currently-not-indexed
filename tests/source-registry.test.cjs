const { test } = require('node:test');
const assert = require('node:assert/strict');
const registry = require('../config/news-sources.json');
const { collectFeeds } = require('../scripts/collect-feeds.cjs');
const window = { start: '2026-01-14T00:00:00Z', end: '2026-01-15T00:00:00Z' };
const request = feeds => ({ schemaVersion: 1, window, feeds });
const item = (url, date = 'Wed, 14 Jan 2026 09:00:00 GMT') =>
  `<item><title>Original synthetic metadata</title><link>${url}</link><pubDate>${date}</pubDate></item>`;
const rss = items => Buffer.from(`<rss version="2.0"><channel>${items}</channel></rss>`);

test('registry preserves broad candidates and only explicit private-trial feed routes', () => {
  assert.equal(registry.schemaVersion, 1);
  assert.equal(new Set(registry.sources.map(source => source.id)).size, registry.sources.length);
  for (const id of ['jica', 'nikkei-asia', 'nhk-world', 'al-jazeera', 'cgtn', 'xinhua', 'bbc', 'cna']) {
    assert.ok(registry.sources.some(source => source.id === id));
  }
  const feeds = [];
  for (const source of registry.sources) {
    assert.equal(new URL(source.discoveryUrl).protocol, 'https:');
    assert.ok(source.role && source.name);
    assert.ok(['access_review', 'private_metadata_trial'].includes(source.reviewStatus));
    if (source.reviewStatus !== 'private_metadata_trial') assert.equal(source.feeds.length, 0);
    for (const feed of source.feeds) {
      assert.equal(new URL(feed.url).protocol, 'https:');
      assert.ok(feed.allowedHosts.length);
      assert.equal(feed.allowedHosts.includes(new URL(feed.url).hostname), true);
      feeds.push(feed.id);
    }
  }
  assert.equal(new Set(feeds).size, feeds.length);
});

test('mixed collection isolates source hosts and retains combined original indices', async () => {
  const result = await collectFeeds(request(['antara-top-news', 'jica-news-ja']), {
    fetch: async url => url.includes('antaranews')
      ? rss(item('https://www.jica.go.jp/synthetic/injected') + item('https://www.antaranews.com/synthetic/a'))
      : rss(item('https://www.jica.go.jp/synthetic/b').repeat(2)),
  });
  assert.equal(result.report.complete, true);
  assert.equal(result.report.records.length, 4);
  assert.equal(result.report.selection.accepted.length, 2);
  assert.deepEqual(result.report.selection.rejected, [{ index: 0, code: 'invalid_or_disallowed_url' }]);
  assert.deepEqual(result.report.selection.accepted[1].originals.map(record => record.index), [2, 3]);
  assert.equal(result.report.records[0].url, 'https://www.jica.go.jp/synthetic/injected');
});

test('candidate-only IDs cannot fetch and new feeds preserve old publication dates', async () => {
  for (const id of ['al-jazeera', 'nikkei-asia', 'cgtn', 'unknown']) {
    assert.equal((await collectFeeds(request([id]), { fetch: () => assert.fail('no request') })).valid, false);
  }
  const result = await collectFeeds(request(['jica-news-ja']), {
    fetch: async () => rss(item('https://www.jica.go.jp/synthetic/old', 'Tue, 13 Jan 2026 09:00:00 GMT')),
  });
  assert.equal(result.report.records[0].publishedAt, '2026-01-13T09:00:00Z');
  assert.deepEqual(result.report.selection.rejected, [{ index: 0, code: 'outside_window' }]);
});

test('aggregate record cap fails a whole feed while retaining prior metadata', async () => {
  const urls = [];
  const result = await collectFeeds(request(['antara-top-news', 'jica-news-ja', 'cna-asia']), {
    fetch: async url => { urls.push(url); return rss(item('https://www.jica.go.jp/synthetic/a').repeat(200)); },
  });
  assert.equal(urls.length, 3);
  assert.equal(result.report.complete, false);
  assert.equal(result.report.records.length, 400);
  assert.equal(result.report.feeds[2].error, 'collection_record_limit');
  assert.equal(result.report.selection.accepted.length, 1);
});

test('only reviewed JICA adapter accepts full English month names and retains raw evidence', async () => {
  const date = 'Wed, 14 January 2026 09:00:00 GMT';
  const result = await collectFeeds(request(['jica-news-ja', 'antara-top-news']), {
    fetch: async url => rss(item(url.includes('jica') ? 'https://www.jica.go.jp/synthetic/a'
      : 'https://www.antaranews.com/synthetic/a', date)),
  });
  assert.deepEqual(result.report.records.map(record => record.publishedAt), ['2026-01-14T09:00:00Z', null]);
  assert.deepEqual(result.report.records[0].publicationDatesRaw, [date]);
  assert.equal(result.report.selection.accepted.length, 1);
});
