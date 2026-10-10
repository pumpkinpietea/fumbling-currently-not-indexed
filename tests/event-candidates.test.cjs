const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { shortlistEvents, evaluatePairs } = require('../scripts/event-candidates.cjs');
const article = (id, title = 'Synthetic Aruna bridge opens', publishedAt = '2026-01-14T09:00:00Z', language = 'en') =>
  ({ id, title, publishedAt, language });
const request = (articles, policy = {}) => ({ schemaVersion: 1, policy: {
  minimumSimilarity: 0.55, maxGapHours: 36, maxPairs: 100, ...policy }, articles });
const entry = (id, label, same = true) => ({ id, category: 'synthetic', rationale: 'Original fixture label.',
  left: article(`${id}-a`, 'abc'), right: article(`${id}-b`, same ? 'abc' : 'xyz'), label });
const benchmark = cases => ({ schemaVersion: 1, provenance: 'synthetic_original',
  policy: request([]).policy, cases });

test('suggestions are stable under permutation and retain identities without merging', () => {
  const articles = [article('c'), article('b'), article('a')];
  const before = structuredClone(articles);
  const result = shortlistEvents(request(articles));
  assert.equal(result.valid, true);
  assert.deepEqual(result.report, shortlistEvents(request([...articles].reverse())).report);
  assert.deepEqual(result.report.pairs.map(pair => [pair.left, pair.right]), [['a', 'b'], ['a', 'c'], ['b', 'c']]);
  assert.equal(result.report.pairs.every(pair => pair.reviewRequired), true);
  assert.equal(Object.hasOwn(result.report, 'groups'), false);
  assert.deepEqual(articles, before);
});
test('Unicode normalization supports full-width Latin and Japanese without translation', () => {
  for (const titles of [['Ａｒｕｎａ ２０２６', 'aruna 2026'], ['架空市が橋を開通', '架空市が橋を開通！']]) {
    const pair = shortlistEvents(request([article('a', titles[0]), article('b', titles[1])])).report.pairs[0];
    assert.equal(pair.similarity, 1);
    assert.deepEqual(pair.flags, ['identical_normalized_title']);
  }
});
test('numeric and language flags are literal review aids, not event decisions', () => {
  const pair = shortlistEvents(request([article('a', 'Earthquake magnitude 6.2 in Aruna'),
    article('b', 'Earthquake magnitude 6.4 in Aruna', undefined, 'id')])).report.pairs[0];
  assert.deepEqual(pair.flags, ['numeric_strings_differ', 'cross_language']);
  assert.equal(pair.reviewRequired, true);
});
test('publication gap and unrounded threshold boundaries are inclusive', () => {
  const articles = [article('a', 'abc'), article('b', 'abde', '2026-01-14T10:00:00Z')];
  assert.equal(shortlistEvents(request(articles, { minimumSimilarity: 0.4, maxGapHours: 1 })).report.pairs.length, 1);
  assert.equal(shortlistEvents(request(articles, { minimumSimilarity: 0.4000001 })).report.pairs.length, 0);
  assert.equal(shortlistEvents(request(articles, { minimumSimilarity: 0.4, maxGapHours: 0.999 })).report.pairs.length, 0);
});
test('empty input is valid and candidate budgets report incomplete coverage explicitly', () => {
  assert.equal(shortlistEvents(request([])).report.totalPairs, 0);
  const result = shortlistEvents(request([article('a'), article('b'), article('c')], { maxPairs: 1 }));
  assert.equal(result.report.eligiblePairs, 3);
  assert.equal(result.report.truncated, true);
  assert.equal(result.report.pairs.length, 1);
});
test('invalid articles, policy and dates fail the whole request', () => {
  for (const articles of [[article('a'), article('a')], [null], [article('a', '!!!')],
    [article('a', 'line\nbreak')], [article('a', 'x'.repeat(501))], [article('a', 'Synthetic', '2026-02-30T09:00:00Z')],
    [article('a', 'Synthetic', undefined, 'unknown')], Array.from({ length: 201 }, (_, i) => article(`a${i}`))]) {
    assert.equal(shortlistEvents(request(articles)).valid, false);
  }
  for (const policy of [{ minimumSimilarity: -1 }, { minimumSimilarity: NaN }, { maxGapHours: 169 },
    { maxPairs: 0 }, { maxPairs: 1001 }, { extra: true }]) assert.equal(shortlistEvents(request([], policy)).valid, false);
});
test('evaluation counts true/false candidates and excludes uncertainty from metrics', () => {
  const result = evaluatePairs(benchmark([entry('tp', 'same_event'), entry('fp', 'different_event'),
    entry('tn', 'different_event', false), entry('fn', 'same_event', false), entry('unknown', 'uncertain')]));
  assert.equal(result.valid, true);
  assert.deepEqual(result.report.metrics, { tp: 1, fp: 1, tn: 1, fn: 1,
    uncertain: 1, uncertainShortlisted: 1, precision: 0.5, recall: 0.5 });
  assert.deepEqual(result.report.byCategory[0].metrics, result.report.metrics);
});
test('undefined precision and recall stay null rather than claiming perfect quality', () => {
  const result = evaluatePairs(benchmark([entry('tn', 'different_event', false)]));
  assert.equal(result.report.metrics.precision, null);
  assert.equal(result.report.metrics.recall, null);
});
test('invalid labels, missing provenance and duplicate case identities cannot enter metrics', () => {
  for (const input of [benchmark([]), benchmark([entry('a', 'unknown')]),
    benchmark([entry('a', 'same_event'), entry('a', 'same_event')]),
    { ...benchmark([entry('a', 'same_event')]), provenance: 'independently_verified' },
    benchmark([{ ...entry('a', 'same_event'), rationale: '' }]),
    benchmark([{ ...entry('a', 'same_event'), right: article('a-a') }])]) assert.equal(evaluatePairs(input).valid, false);
});
test('original synthetic benchmark exposes false candidates and cross-language misses', () => {
  const input = JSON.parse(fs.readFileSync('tests/fixtures/event-pairs-synthetic.json'));
  const result = evaluatePairs(input);
  assert.equal(result.valid, true);
  assert.equal(result.report.provenance, 'synthetic_original');
  assert.ok(result.report.metrics.fp > 0);
  assert.ok(result.report.metrics.fn > 0);
  assert.ok(result.report.byCategory.find(entry => entry.category === 'cross_language').metrics.fn > 0);
  assert.equal(result.report.cases.find(entry => entry.id === 'repeated-title').shortlisted, true);
});
test('CLI writes private reports, redacts titles/IDs, refuses overwrite and signals truncation', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'event-pairs-'));
  try {
    const input = path.join(root, 'input.json'), output = path.join(root, 'report.json');
    const run = mode => spawnSync(process.execPath, ['scripts/event-candidates.cjs', mode, input, output], { encoding: 'utf8' });
    fs.writeFileSync(input, JSON.stringify(request([article('private-a'), article('private-b'), article('private-c')], { maxPairs: 1 })));
    const first = run('shortlist');
    assert.equal(first.status, 1);
    assert.equal(JSON.parse(first.stdout).errors[0].code, 'pair_budget_exceeded');
    assert.equal(first.stdout.includes('Synthetic'), false);
    assert.equal(first.stdout.includes('private-'), false);
    assert.equal(fs.statSync(output).mode & 0o777, 0o600);
    const before = fs.readFileSync(output, 'utf8');
    assert.equal(run('shortlist').status, 1);
    assert.equal(fs.readFileSync(output, 'utf8'), before);
    fs.unlinkSync(output);
    fs.writeFileSync(input, JSON.stringify(benchmark([entry('tn', 'different_event', false)])));
    assert.equal(run('evaluate').status, 0);
    fs.unlinkSync(output); fs.symlinkSync(input, output);
    assert.equal(run('evaluate').status, 1);
    assert.equal(run('unknown').status, 2);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
