const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { buildEvidenceDrafts, writeEvidenceDrafts } = require('../scripts/render-evidence.cjs');
const fixture = () => JSON.parse(fs.readFileSync('tests/fixtures/evidence-valid.json'));
const hash = text => createHash('sha256').update(text, 'utf8').digest('hex');
const rejected = (input, code) => {
  const result = buildEvidenceDrafts(input);
  assert.equal(result.valid, false);
  assert.equal(Object.hasOwn(result, 'files'), false);
  if (code) assert.ok(result.errors.some(error => error.code === code), JSON.stringify(result.errors));
};
test('evidence derives bilingual draft references and an audit without raw source records', () => {
  const input = fixture(), before = structuredClone(input), result = buildEvidenceDrafts(input);
  assert.equal(result.valid, true);
  assert.equal(Object.keys(result.files).length, 2);
  for (const contents of Object.values(result.files)) {
    assert.match(contents, /draft: true/);
    assert.ok(contents.includes('https://example.com/report'));
    assert.equal(contents.includes(input.sources[0].body), false);
  }
  assert.equal(result.audit.sources[0].bodySha256, hash(input.sources[0].body));
  assert.equal(result.audit.facts[0].claimSha256, hash(input.events[0].facts[0].claim));
  assert.equal(result.audit.facts[0].evidence[0].quoteSha256, hash(input.events[0].facts[0].evidence[0].quote));
  for (const file of result.audit.files) assert.equal(file.sha256, hash(result.files[file.path]));
  const serialized = JSON.stringify(result.audit);
  assert.equal(serialized.includes(input.sources[0].body), false);
  assert.equal(serialized.includes(input.events[0].facts[0].evidence[0].quote), false);
  assert.equal(serialized.includes(input.events[0].facts[0].claim), false);
  assert.deepEqual(input, before);
});
test('changed bodies and stale or malformed hashes block drafts', () => {
  for (const change of [source => { source.body += ' Changed.'; }, source => { source.sha256 = '0'.repeat(64); },
    source => { source.sha256 = source.sha256.toUpperCase(); }, source => { source.body = '\ud800'; }]) {
    const input = fixture(); change(input.sources[0]); rejected(input);
  }
});
test('declared snippet/title/RSS evidence cannot be promoted into body-supported drafts', () => {
  for (const method of ['snippet', 'title', 'rss', 'unknown']) {
    const input = fixture(); input.sources[0].method = method; rejected(input, 'body_evidence_required');
  }
});
test('bad quote offsets, altered quotations, unknown sources and duplicate spans fail', () => {
  for (const change of [citation => { citation.start--; }, citation => { citation.end++; },
    citation => { citation.start = 1.5; }, citation => { citation.start = -1; },
    citation => { citation.quote += ' invented'; }, citation => { citation.sourceId = 'unknown'; }]) {
    const input = fixture(); change(input.events[0].facts[0].evidence[0]); rejected(input);
  }
  const input = fixture(); input.events[0].facts[0].evidence.push(structuredClone(input.events[0].facts[0].evidence[0]));
  rejected(input, 'duplicate_citation');
});
test('UTF-16 citation spans support astral characters and reject split surrogate pairs', () => {
  const input = fixture(), source = input.sources[0], citation = input.events[0].facts[0].evidence[0];
  source.body = `🌱 ${source.body}`; source.sha256 = hash(source.body);
  citation.start += 3; citation.end += 3;
  assert.equal(buildEvidenceDrafts(input).valid, true);
  citation.start = 0; citation.end = 1; citation.quote = source.body.slice(0, 1);
  rejected(input, 'quote_span_mismatch');
});
test('invented claim numbers and omitted or changed localized numbers block drafts', () => {
  const invented = fixture(); invented.events[0].facts[0].claim = 'Aruna opened 99 public reading rooms.';
  rejected(invented, 'unsupported_claim_number');
  for (const text of ['アルナ市に公共の読書室が開設されました。', 'アルナ市に公共の読書室が99か所開設されました。']) {
    const input = fixture(); input.editions[1].events[0].facts[0].text = text; rejected(input, 'localized_numbers_mismatch');
  }
  const compatible = fixture(); compatible.editions[1].events[0].facts[0].text = '読書室が３か所開設されました。';
  assert.equal(buildEvidenceDrafts(compatible).valid, true);
});
test('numeric checks do not prove quantity roles or semantic entailment', () => {
  const input = fixture();
  input.events[0].facts[0].claim = 'Aruna opened 3 kilometers of road.';
  input.editions[0].events[0].facts[0].text = 'Aruna opened 3 kilometers of road.';
  input.editions[1].events[0].facts[0].text = 'アルナ市に3キロの道路が開通しました。';
  assert.equal(buildEvidenceDrafts(input).valid, true);
});
test('missing facts, unknown identities and model-provided source links fail existing contracts', () => {
  for (const change of [input => { input.editions[1].events[0].facts = []; },
    input => { input.editions[1].events[0].facts[0].id = 'unknown'; },
    input => { input.editions[1].events[0].sourceUrls = ['https://example.com/invented']; },
    input => { input.events[0].facts[0].evidence = []; },
    input => { input.events.push(structuredClone(input.events[0])); }]) {
    const input = fixture(); change(input); rejected(input);
  }
});
test('source freshness, chronology and unused evidence cannot bypass the edition validator', () => {
  for (const change of [input => { input.sources[0].publishedAt = '2025-01-14T09:00:00Z'; },
    input => { input.sources[0].retrievedAt = '2026-01-14T08:00:00Z'; },
    input => { input.sources[0].url = 'http://example.com/report'; },
    input => { input.sources.push({ ...input.sources[0], id: 'unused', url: 'https://example.com/unused' }); },
    input => { input.languages.push('id'); }]) {
    const input = fixture(); change(input); rejected(input);
  }
});
test('schema and resource bounds reject oversized, malformed and empty input', () => {
  for (const change of [input => { input.extra = true; }, input => { input.sources = []; },
    input => { input.sources[0].body = 'x'.repeat(50001); },
    input => { input.events[0].facts[0].claim = 'x'.repeat(2001); },
    input => { input.events[0].facts[0].evidence = Array(6).fill(input.events[0].facts[0].evidence[0]); },
    input => { input.sources = Array(51).fill(input.sources[0]); },
    input => { input.events = Array(51).fill(input.events[0]); }]) {
    const input = fixture(); change(input); rejected(input);
  }
});
test('private bundle creation preserves existing directories and symlinks and validates before writes', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'evidence-bundle-'));
  try {
    const destination = path.join(root, 'drafts'), input = fixture();
    assert.equal(writeEvidenceDrafts(input, destination).valid, true);
    assert.equal(fs.statSync(destination).mode & 0o777, 0o700);
    const audit = JSON.parse(fs.readFileSync(path.join(destination, 'evidence-audit.json')));
    for (const file of audit.files) {
      const filePath = path.join(destination, file.path);
      assert.equal(fs.statSync(filePath).mode & 0o777, 0o600);
      assert.equal(hash(fs.readFileSync(filePath, 'utf8')), file.sha256);
    }
    const saved = fs.readFileSync(path.join(destination, 'evidence-audit.json'), 'utf8');
    assert.equal(writeEvidenceDrafts(input, destination).valid, false);
    assert.equal(fs.readFileSync(path.join(destination, 'evidence-audit.json'), 'utf8'), saved);
    fs.symlinkSync(destination, path.join(root, 'link'));
    assert.equal(writeEvidenceDrafts(input, path.join(root, 'link')).valid, false);
    input.events[0].facts[0].evidence = [];
    const absent = path.join(root, 'invalid');
    assert.equal(writeEvidenceDrafts(input, absent).valid, false);
    assert.equal(fs.existsSync(absent), false);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
test('CLI redacts body, claim, quote, source URL and local paths', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'evidence-cli-'));
  try {
    const source = path.join(root, 'request.json'), destination = path.join(root, 'drafts'), input = fixture();
    fs.writeFileSync(source, JSON.stringify(input));
    const run = () => spawnSync(process.execPath, ['scripts/render-evidence.cjs', source, destination], { encoding: 'utf8' });
    const first = run(); assert.equal(first.status, 0);
    assert.deepEqual(JSON.parse(first.stdout), { valid: true, errors: [], drafts: 2, audit: true });
    input.sources[0].sha256 = '0'.repeat(64); fs.writeFileSync(source, JSON.stringify(input));
    const failed = run(); assert.equal(failed.status, 1);
    for (const value of [input.sources[0].body, input.events[0].facts[0].claim,
      input.events[0].facts[0].evidence[0].quote, input.sources[0].url, root]) assert.equal(failed.stdout.includes(value), false);
    assert.equal(spawnSync(process.execPath, ['scripts/render-evidence.cjs']).status, 2);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
