const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { EventEmitter } = require('node:events');
const { spawnSync } = require('node:child_process');
const { parseRss, publicationTime, MAX_FEED_BYTES } = require('../scripts/rss-metadata.cjs');
const { fetchFeed, publicIpv4 } = require('../scripts/feed-transport.cjs');
const { collectFeeds, collectFile } = require('../scripts/collect-feeds.cjs');
const item = (date = 'Wed, 14 Jan 2026 16:00:00 +0700', url = 'https://www.antaranews.com/synthetic/example') =>
  `<item><title>Synthetic &amp; original fixture</title><link>${url}</link><pubDate>${date}</pubDate></item>`;
const rss = (items = item()) => Buffer.from(`<?xml version="1.0"?><rss version="2.0"><channel>${items}</channel></rss>`);
const request = (feeds = ['antara-top-news', 'antara-economy']) => ({ schemaVersion: 1,
  window: { start: '2026-01-14T00:00:00Z', end: '2026-01-15T00:00:00Z' }, feeds });

test('RSS retains metadata and explicitly normalizes publication timezone', () => {
  const result = parseRss(rss());
  assert.equal(result.valid, true);
  assert.deepEqual(result.records, [{ itemIndex: 0, title: 'Synthetic & original fixture',
    url: 'https://www.antaranews.com/synthetic/example', publicationDatesRaw: ['Wed, 14 Jan 2026 16:00:00 +0700'],
    publishedAt: '2026-01-14T09:00:00Z' }]);
  assert.equal(publicationTime('14 Jan 2026 00:30:00 +0700'), '2026-01-13T17:30:00Z');
  assert.equal(publicationTime('14 Jan 2026 09:00:00 GMT'), '2026-01-14T09:00:00Z');
  assert.equal(publicationTime('14 Jan 2026 09:00:00 UT'), '2026-01-14T09:00:00Z');
});
test('ambiguous, timezone-free, impossible dates and inconsistent weekdays fail closed', () => {
  for (const date of ['14 Jan 2026 09:00:00', '14 Jan 2026 09:00:00 EST',
    '31 Feb 2026 09:00:00 +0700', 'Thu, 14 Jan 2026 09:00:00 +0700',
    '14 Jan 2026 09:00:60 +0700', '14 Jan 2026 09:00:00 -0000',
    '14 Jan 2026 09:00:00 +2460', '14 Jan 26 09:00:00 GMT']) assert.equal(publicationTime(date), null);
});
test('missing or duplicate publication dates never fall back to channel build date', () => {
  const result = parseRss(rss('<lastBuildDate>Wed, 14 Jan 2026 09:00:00 GMT</lastBuildDate>' +
    '<item><title>Synthetic</title><link>https://example.com/a</link></item>' +
    item().replace('</pubDate>', '</pubDate><pubDate>Wed, 14 Jan 2026 09:00:00 GMT</pubDate>')));
  assert.equal(result.valid, true);
  assert.deepEqual(result.records.map(record => record.publishedAt), [null, null]);
  assert.equal(result.records[1].publicationDatesRaw.length, 2);
});
test('rejects DTDs, entities, malformed XML, invalid UTF-8 and unsupported roots', () => {
  const inputs = [Buffer.from('<!DOCTYPE rss [<!ENTITY a "x">]><rss version="2.0"><channel/></rss>'),
    rss('<item><title>&unknown;</title></item>'), Buffer.from('<rss version="2.0"><channel>'),
    Buffer.from([0xff]), Buffer.from('<feed/>'), Buffer.from('<rss version="1.0"><channel/></rss>'),
    rss('<item><title><b>nested</b></title></item>'), rss('<item><link><![CDATA[x]]><x/></link></item>')];
  for (const input of inputs) assert.equal(parseRss(input).valid, false);
});
test('resource caps reject whole feeds and XML namespaces cannot impersonate fields', () => {
  for (const input of [Buffer.alloc(MAX_FEED_BYTES + 1), rss(item().repeat(201)),
    rss(`<item><title>${'x'.repeat(501)}</title></item>`), rss('<x>'.repeat(33) + '</x>'.repeat(33)),
    rss('<x/>'.repeat(10001))]) assert.equal(parseRss(input).valid, false);
  const result = parseRss(rss('<item xmlns:x="urn:synthetic"><x:pubDate>Wed, 14 Jan 2026 09:00:00 GMT</x:pubDate></item>'));
  assert.equal(result.valid, true);
  assert.equal(result.records[0].publishedAt, null);
});
test('collector integrates deduplication while keeping both feed provenances', async () => {
  const urls = [];
  const result = await collectFeeds(request(), { fetch: async url => { urls.push(url); return rss(); },
    now: () => new Date('2026-01-15T01:00:00Z') });
  assert.equal(result.report.complete, true);
  assert.equal(result.report.collectedAt, '2026-01-15T01:00:00.000Z');
  assert.equal(result.report.records.length, 2);
  assert.deepEqual(result.report.records.map(record => record.feedId), ['antara-top-news', 'antara-economy']);
  assert.equal(result.report.selection.accepted.length, 1);
  assert.deepEqual(result.report.selection.accepted[0].originals.map(original => original.index), [0, 1]);
  assert.deepEqual(urls, ['https://www.antaranews.com/rss/top-news.xml', 'https://www.antaranews.com/rss/ekonomi.xml']);
});
test('feed failure is distinct from healthy empty selection and from rejected metadata', async () => {
  const failed = await collectFeeds(request(), { fetch: async url => {
    if (url.includes('ekonomi')) throw new Error('remote private detail');
    return rss(item('unknown date'));
  } });
  assert.equal(failed.report.complete, false);
  assert.equal(failed.report.feeds[1].status, 'failed');
  assert.equal(failed.report.selection.rejected[0].code, 'invalid_timestamp');
  assert.equal(JSON.stringify(failed).includes('remote private detail'), false);
  const empty = await collectFeeds(request(), { fetch: async () => rss('') });
  assert.equal(empty.report.complete, true);
  assert.equal(empty.report.selection.accepted.length, 0);
});
test('malformed XML and conflicting feed dates block acceptance', async () => {
  const bad = await collectFeeds(request(['antara-top-news']), { fetch: async () => Buffer.from('<html/>') });
  assert.equal(bad.report.complete, false);
  const conflict = await collectFeeds(request(), { fetch: async url => rss(item(url.includes('ekonomi')
    ? 'Wed, 14 Jan 2026 10:00:00 GMT' : 'Wed, 14 Jan 2026 09:00:00 GMT')) });
  assert.equal(conflict.report.selection.accepted.length, 0);
  assert.equal(conflict.report.selection.rejected.length, 2);
});
test('unknown feed IDs, duplicate selections and invalid windows make no requests', async () => {
  for (const input of [request([]), request(['https://example.com/feed']), request(['constructor']),
    request(['antara-top-news', 'antara-top-news']), { ...request(), extra: true },
    { ...request(), window: { start: 'yesterday', end: 'today' } }]) {
    const result = await collectFeeds(input, { fetch: () => assert.fail('must not fetch') });
    assert.equal(result.valid, false);
  }
});

test('public IPv4 guard rejects local, special-use, mapped IPv6 and malformed addresses', () => {
  assert.equal(publicIpv4('8.8.8.8'), true);
  for (const address of ['127.0.0.1', '10.0.0.1', '169.254.169.254', '172.16.0.1',
    '192.168.1.1', '100.64.0.1', '198.18.0.1', '192.0.2.1', '224.0.0.1',
    '::ffff:127.0.0.1', '::1', 'invalid', undefined]) assert.equal(publicIpv4(address), false);
});
function fakeNetwork({ status = 200, type = 'application/rss+xml', encoding, length, chunks = [rss()],
  addresses = ['8.8.8.8'], stall = false, dnsStall = false } = {}) {
  let calls = 0, options;
  return { resolve: (host, callback) => { if (!dnsStall) callback(null, addresses); },
    request: (url, opts, callback) => {
      calls++; options = opts;
      const req = new EventEmitter(); req.destroy = () => {}; req.end = () => {
        if (stall) return;
        setImmediate(() => {
          const res = new EventEmitter(); res.destroy = () => {};
          res.statusCode = status; res.headers = { 'content-type': type,
            'content-encoding': encoding, 'content-length': length };
          callback(res);
          for (const chunk of chunks) res.emit('data', chunk);
          res.emit('end');
        });
      };
      return req;
    }, get calls() { return calls; }, get options() { return options; } };
}
test('transport pins checked DNS, retains TLS verification, and requests identity encoding', async () => {
  const network = fakeNetwork();
  assert.deepEqual(await fetchFeed('https://example.com/feed', network), rss());
  assert.equal(network.calls, 1);
  assert.equal(network.options.rejectUnauthorized, true);
  assert.equal(network.options.servername, 'example.com');
  assert.equal(network.options.agent, false);
  assert.equal(network.options.headers['Accept-Encoding'], 'identity');
  network.options.lookup('example.com', { all: true }, (error, addresses) => {
    assert.equal(error, null); assert.deepEqual(addresses, [{ address: '8.8.8.8', family: 4 }]);
  });
});
test('transport never follows redirects or connects to nonpublic DNS', async () => {
  const redirect = fakeNetwork({ status: 302 });
  await assert.rejects(fetchFeed('https://example.com/feed', redirect), /feed_response_rejected/);
  assert.equal(redirect.calls, 1);
  for (const addresses of [['127.0.0.1'], ['8.8.8.8', '10.0.0.1'], []]) {
    const network = fakeNetwork({ addresses });
    await assert.rejects(fetchFeed('https://example.com/feed', network), /feed_dns_rejected/);
    assert.equal(network.calls, 0);
  }
});
test('transport rejects oversized, compressed and non-XML responses', async () => {
  for (const config of [{ type: 'text/html' }, { encoding: 'gzip' }, { length: '99999999' },
    { chunks: [Buffer.alloc(8), Buffer.alloc(8)] }]) {
    await assert.rejects(fetchFeed('https://example.com/feed', { ...fakeNetwork(config), maxBytes: 10 }));
  }
});
test('transport deadline includes DNS and response stalls and invalid URLs never connect', async () => {
  for (const config of [{ stall: true }, { dnsStall: true }]) {
    await assert.rejects(fetchFeed('https://example.com/feed', { ...fakeNetwork(config), timeoutMs: 10 }), /feed_timeout/);
  }
  const network = fakeNetwork();
  await assert.rejects(fetchFeed('http://example.com/feed', network), /feed_request_rejected/);
  assert.equal(network.calls, 0);
});
test('local report creation is private, exclusive and failed collection exits unsuccessfully', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'feed-trial-'));
  try {
    const source = path.join(root, 'request.json'), output = path.join(root, 'report.json');
    fs.writeFileSync(source, JSON.stringify(request()));
    const result = await collectFile(source, output, { fetch: async () => rss() });
    assert.equal(result.valid, true);
    assert.equal(fs.statSync(output).mode & 0o777, 0o600);
    assert.equal(JSON.stringify(result).includes('antaranews'), false);
    const original = fs.readFileSync(output, 'utf8');
    assert.equal((await collectFile(source, output, { fetch: () => assert.fail('overwrite must not fetch') })).valid, false);
    assert.equal(fs.readFileSync(output, 'utf8'), original);
    fs.unlinkSync(output);
    assert.equal((await collectFile(source, output, { fetch: async () => { throw new Error(); } })).valid, false);
    assert.equal(JSON.parse(fs.readFileSync(output)).complete, false);
    fs.unlinkSync(output); fs.symlinkSync(source, output);
    assert.equal((await collectFile(source, output, { fetch: () => assert.fail('symlink must not fetch') })).valid, false);
    const run = spawnSync(process.execPath, ['scripts/collect-feeds.cjs', source, output], { encoding: 'utf8' });
    assert.equal(run.status, 1); assert.equal(run.stdout.includes(root), false);
    assert.equal(spawnSync(process.execPath, ['scripts/collect-feeds.cjs']).status, 2);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
