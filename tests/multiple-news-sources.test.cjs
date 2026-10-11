const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { parseRss } = require('../scripts/rss-metadata.cjs');
const { sourcePolicy, dailyFeeds } = require('../scripts/news-source-policy.cjs');
const { extractRssEvidence } = require('../scripts/news-evidence.cjs');
const { shortlist, renderEdition, validateBundle } = require('../scripts/daily-news.cjs');
const description = 'Indonesia announced a digital services initiative. The ministry described its plans.';
const common = { title: 'Indonesia announces digital services initiative', description,
  publishedAt: '2026-10-10T04:00:00Z' };
const records = [
  { ...common, feedId: 'antara-tech', url: 'https://www.antaranews.com/berita/1234567/indonesia-digital-services' },
  { ...common, feedId: 'vietnam-news-economy', url: 'https://vietnamnews.vn/economy/1234567/indonesia-digital-services.html' },
  { ...common, feedId: 'global-voices-asia', creator: 'Synthetic Contributor', url: 'https://globalvoices.org/2026/10/10/indonesia-digital-services/' },
];
test('daily feed allowlist excludes restricted candidates and bounds collection to ten feeds', () => {
  assert.equal(dailyFeeds.length, 10);
  assert.ok(dailyFeeds.includes('jica-news-ja'));
  assert.equal(new Set(dailyFeeds).size, 10);
  for (const id of ['cna-asia', 'al-jazeera', 'cgtn', 'nikkei-asia', 'nhk-world']) assert.ok(!dailyFeeds.includes(id));
});
test('source evidence binds feed identity to its own publisher host and article path', () => {
  for (const record of records) {
    const source = extractRssEvidence(record);
    assert.equal(source.feedId, record.feedId);
    assert.equal(source.publisher, sourcePolicy(record).source.name);
    for (const patch of [{ feedId: 'cna-asia' }, { url: 'https://127.0.0.1/a' },
      { url: record.url + '?tracking=x' }, { url: record.url + '#fragment' }])
      assert.throws(() => extractRssEvidence({ ...record, ...patch }));
  }
  assert.throws(() => extractRssEvidence({ ...records[1], feedId: 'global-voices-asia' }));
  assert.throws(() => extractRssEvidence({ ...records[2], creator: '[Injected](https://example.com)' }));
  assert.throws(() => extractRssEvidence({ ...records[2], creator: undefined }));
});
test('JICA ignores navigation descriptions and preserves only dated announcement titles', () => {
  const record = { feedId: 'jica-news-ja', url: 'https://www.jica.go.jp/information/press/2026/20261010_12.html',
    title: 'ベトナムのデジタル産業人材育成に向けた新たな協力事業についての発表と具体的な支援事業計画', publishedAt: common.publishedAt,
    description: '<a>Read full article</a><script>unsupported artificial details</script>' };
  const source = extractRssEvidence(record);
  assert.equal(source.evidenceType, 'official_rss_title');assert.equal(source.excerpt, record.title);
  assert.equal(shortlist([record], [{ normalizedUrl: record.url }], []).length, 1);
  assert.throws(() => extractRssEvidence({ ...record, title: 'Short title' }));
});
test('balanced multilingual shortlist avoids one publisher crowding out eligible peers', () => {
  const many = Array.from({ length: 6 }, (_, i) => ({ ...records[0], url: records[0].url + '-' + i }));
  const items = [...many, ...records.slice(1), { ...records[1], title: 'Japan expands AI research', description: 'Japan announced an AI research initiative.', url: records[1].url.replace('indonesia', 'japan') }];
  const selected = shortlist(items, items.map(r => ({ normalizedUrl: r.url })), []);
  assert.equal(selected.length, 3);
  assert.equal(new Set(selected.map(r => sourcePolicy(r).source.id)).size, 3);
  assert.equal(shortlist([records[1]], [{ normalizedUrl: records[1].url }], [records[1].url]).length, 0);
});
test('UTF-16 and trusted Dublin Core creators are enabled only by selected feed adapters', () => {
  const xml = '<?xml version="1.0" encoding="utf-16"?><rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/"><channel><item><title>Việt Nam digital services</title><link>https://vietnamnews.vn/economy/123/a.html</link><pubDate>Sat, 10 Oct 2026 11:00:00 +0700</pubDate><dc:creator>Synthetic Contributor</dc:creator></item></channel></rss>';
  const bytes = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(xml, 'utf16le')]);
  assert.equal(parseRss(bytes).valid, false);
  const parsed = parseRss(bytes, { allowUtf16: true, includeCreator: true });
  assert.equal(parseRss(bytes.subarray(2), { allowUtf16: true }).valid, true);
  assert.equal(parsed.valid, true);assert.equal(parsed.records[0].creator, 'Synthetic Contributor');
  assert.equal(parsed.records[0].publishedAt, common.publishedAt);
  const spoof = Buffer.from(xml.replace('encoding="utf-16"', 'encoding="utf-8"').replace('http://purl.org/dc/elements/1.1/', 'urn:untrusted'));
  assert.equal(parseRss(spoof, { includeCreator: true }).records[0].creator, null);
  const unqualified = Buffer.from(xml.replace('encoding="utf-16"', 'encoding="utf-8"').replaceAll('dc:creator', 'creator'));
  assert.equal(parseRss(unqualified, { includeCreator: true }).records[0].creator, null);
});
test('mixed-source bundles preserve author/license before adaptations and reject spoofed provenance', () => {
  const sources = records.map(extractRssEvidence);
  const event = { sourceIds: sources.map(s => s.id),
    en: { title: 'Indonesia announces digital services plans', summary: 'Indonesia announced a digital services initiative, according to the ministry.' },
    jp: { title: 'インドネシア、デジタルサービス計画を発表', summary: 'インドネシアの省はデジタルサービスに関する取り組みを発表した。' },
    quotes: sources.map(s => ({ sourceId: s.id, text: 'Indonesia announced a digital services initiative.' })) };
  const bundle = { schemaVersion: 1, editionDate: '2026-10-11', revision: 'a'.repeat(40), sources, events: [event],
    review: { approved: true, checkedIds: event.sourceIds }, files: renderEdition('2026-10-11', [event], sources) };
  validateBundle(bundle, bundle.editionDate);
  for (const language of ['en', 'jp']) {
    const content = bundle.files[`content/${language}/article/2026-10-11-southeast-asia-tech.md`].split('\n---\n')[1];
    assert.ok(content.includes('Viet Nam News') && content.includes('Global Voices · Synthetic Contributor'));
    assert.ok(content.includes('[CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)'));
    assert.ok(content.indexOf('Synthetic Contributor') < content.indexOf(event[language].summary));
  }
  for (const patch of [{ publisher: 'ANTARA' }, { feedId: 'antara-tech' }, { creator: undefined },
    { publishedAt: '2017-05-01T00:00:00Z' }]) {
    const bad = structuredClone(bundle);Object.assign(bad.sources[2], patch);
    assert.throws(() => validateBundle(bad, bad.editionDate));
  }
  const bad = structuredClone(bundle);bad.sources[2].excerpt = 'Fabricated';
  bad.sources[2].excerptHash = crypto.createHash('sha256').update('Fabricated').digest('hex');
  assert.throws(() => validateBundle(bad, bad.editionDate));
});
