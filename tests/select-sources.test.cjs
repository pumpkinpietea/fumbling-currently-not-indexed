const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { selectSources } = require('../scripts/select-sources.cjs');
const article = (url = 'https://example.com/news', publishedAt = '2026-01-14T09:00:00Z') => ({ url, publishedAt });
const request = (articles = [article()]) => ({ schemaVersion: 1,
  window: { start: '2026-01-14T00:00:00Z', end: '2026-01-15T00:00:00Z' },
  allowedHosts: ['example.com'], trackingParameters: ['utm_source'], articles });

test('selection keeps provenance and only removes explicit tracking names', () => {
  const a = 'https://example.com/news?id=7&x=a%20b&x=a+b&utm_source=feed';
  const b = 'https://example.com/news?id=7&x=a%20b&x=a+b';
  const result = selectSources(request([article(a), article(b), article(`${b}&ref=other`)]));
  assert.equal(result.valid, true);
  assert.equal(result.selection.accepted.length, 2);
  assert.deepEqual(result.selection.accepted[0], { normalizedUrl: b,
    publishedAt: article().publishedAt, originals: [{ index: 0, url: a }, { index: 1, url: b }] });
});
test('publication window is half open and missing dates are rejected', () => {
  const result = selectSources(request([
    article('https://example.com/a', '2026-01-14T00:00:00Z'),
    article('https://example.com/b', '2026-01-15T00:00:00Z'),
    article('https://example.com/c', null),
    article('https://example.com/2026/01/14', '2026-02-30T00:00:00Z')
  ])).selection;
  assert.equal(result.accepted.length, 1);
  assert.deepEqual(result.rejected.map(item => item.code), ['outside_window', 'invalid_timestamp', 'invalid_timestamp']);
});
test('conflicting dates quarantine the whole group even outside the window', () => {
  const result = selectSources(request([article(), article('https://example.com/news?utm_source=x',
    '2025-01-01T00:00:00Z')])).selection;
  assert.equal(result.accepted.length, 0);
  assert.deepEqual(result.rejected.map(item => item.code), Array(2).fill('conflicting_publication_dates'));
});
test('URL policy rejects credentials, fragments, ports and unapproved subdomains', () => {
  const urls = ['http://example.com/a', 'https://user:pass@example.com/a', 'https://example.com/a#x',
    'https://example.com:8443/a', 'https://sub.example.com/a', 'https://example.com/a b'];
  assert.equal(selectSources(request(urls.map(url => article(url)))).selection.rejected.length, urls.length);
});
test('empty candidates are valid but malformed policies and records are not accepted', () => {
  assert.deepEqual(selectSources(request([])).selection.accepted, []);
  for (const change of [{ extra: true }, { articles: Array(501).fill(article()) },
    { allowedHosts: ['*.example.com'] }, { trackingParameters: ['utm_source', 'utm_source'] },
    { window: { start: '2026-02-30T00:00:00Z', end: '2026-03-03T00:00:00Z' } }]) {
    assert.equal(selectSources({ ...request(), ...change }).valid, false);
  }
  assert.deepEqual(selectSources(request([null, { ...article(), extra: true }])).selection.rejected,
    [{ index: 0, code: 'invalid_record' }, { index: 1, code: 'invalid_record' }]);
});
test('query filtering handles encoded names while retaining case and repeated identity parameters', () => {
  const url = 'https://example.com/a?%75tm_source=a&UTM_source=b&id=1&id=2&utm_source=c';
  assert.equal(selectSources(request([article(url)])).selection.accepted[0].normalizedUrl,
    'https://example.com/a?UTM_source=b&id=1&id=2');
});
test('CLI writes a new private file, redacts source data, and refuses overwrite or symlink', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'selection-'));
  try {
    const input = path.join(root, 'input.json'), output = path.join(root, 'output.json');
    fs.writeFileSync(input, JSON.stringify(request()));
    const run = () => spawnSync(process.execPath, ['scripts/select-sources.cjs', input, output], { encoding: 'utf8' });
    const first = run();
    assert.equal(first.status, 0);
    assert.equal(first.stdout.includes('example.com'), false);
    assert.equal(JSON.parse(fs.readFileSync(output)).accepted.length, 1);
    assert.equal(fs.statSync(output).mode & 0o777, 0o600);
    const before = fs.readFileSync(output, 'utf8');
    assert.equal(run().status, 1);
    assert.equal(fs.readFileSync(output, 'utf8'), before);
    fs.unlinkSync(output);
    fs.symlinkSync(input, output);
    assert.equal(run().status, 1);
    assert.equal(JSON.parse(fs.readFileSync(input)).schemaVersion, 1);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
