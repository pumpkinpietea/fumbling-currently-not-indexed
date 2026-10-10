const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { validateEdition, readCandidate, MAX_BYTES } = require('../scripts/check-edition.cjs');

function candidate() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/edition-valid.json'), 'utf8'));
}
function invalid(mutator, code) {
  const input = candidate(); mutator(input);
  const result = validateEdition(input);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.code === code), JSON.stringify(result));
}
function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'edition-contract-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const file = path.join(directory, 'candidate.json');
  fs.writeFileSync(file, JSON.stringify(candidate()));
  return { directory, file };
}
const cli = path.resolve(__dirname, '../scripts/check-edition.cjs');

test('shared event/fact/source set validates for explicitly enabled languages', () => {
  const input = candidate();
  assert.deepEqual(validateEdition(input), { valid: true, errors: [] });
  input.languages.push('id');
  input.editions.push({ ...structuredClone(input.editions[0]), language: 'id' });
  assert.equal(validateEdition(input).valid, true);
});

test('omitted, duplicated and extra language editions fail', () => {
  invalid(c => c.editions.pop(), 'language_coverage_mismatch');
  invalid(c => c.editions.push(structuredClone(c.editions[0])), 'duplicate_id');
  invalid(c => { c.editions[1].language = 'id'; }, 'unknown_language');
  invalid(c => c.languages.push('en'), 'duplicate_id');
  invalid(c => c.languages.push('unknown'), 'unsupported_language');
});

test('missing, duplicate and unknown event IDs fail even if counts look correct', () => {
  invalid(c => { c.editions[1].events = []; }, 'coverage_mismatch');
  invalid(c => c.editions[0].events.push(structuredClone(c.editions[0].events[0])), 'duplicate_reference');
  invalid(c => { c.editions[1].events[0].id = 'other'; }, 'unknown_event');
  invalid(c => c.events.push(structuredClone(c.events[0])), 'duplicate_id');
});

test('missing, duplicate and invented fact references fail', () => {
  invalid(c => { c.editions[0].events[0].factIds = []; }, 'coverage_mismatch');
  invalid(c => c.editions[0].events[0].factIds.push('fact1'), 'duplicate_reference');
  invalid(c => { c.editions[1].events[0].factIds = ['invented']; }, 'unknown_reference');
  invalid(c => c.events[0].facts.push(structuredClone(c.events[0].facts[0])), 'duplicate_id');
});

test('invented, missing and duplicate source links cannot pass', () => {
  invalid(c => { c.editions[0].events[0].sourceUrls = ['https://example.com/fabricated']; }, 'unknown_reference');
  invalid(c => { c.editions[0].events[0].sourceUrls = []; }, 'coverage_mismatch');
  invalid(c => c.editions[0].events[0].sourceUrls.push('https://example.com/report'), 'duplicate_reference');
});

test('provenance must close over known sources and fact citations', () => {
  invalid(c => { c.events[0].sourceIds = ['missing']; }, 'unknown_reference');
  invalid(c => { c.events[0].facts[0].sourceIds = ['missing']; }, 'unknown_reference');
  invalid(c => c.sources.push({ id: 'unused', url: 'https://example.com/unused', publishedAt: c.sources[0].publishedAt }), 'unused_sources');
  invalid(c => c.sources.push(structuredClone(c.sources[0])), 'duplicate_id');
  invalid(c => { c.sources.push({ ...c.sources[0], id: 'other' }); }, 'duplicate_url');
  invalid(c => { c.events[0].facts[0].sourceIds = []; }, 'nonempty_array_required');
  const input = candidate();
  input.sources.push({ id: 'source2', url: 'https://example.com/second', publishedAt: input.sources[0].publishedAt });
  input.events[0].sourceIds.push('source2');
  assert.ok(validateEdition(input).errors.some(e => e.code === 'coverage_mismatch'));
});

test('source URL syntax rejects credentials, fragments and non-HTTPS schemes', () => {
  for (const url of ['http://example.com/report', 'https://user:placeholder@example.com/report', 'https://example.com/report#fragment', 'not-a-url']) {
    invalid(c => { c.sources[0].url = url; }, 'invalid_source_url');
  }
});

test('source interval is half-open; unknown, stale and normalized dates fail', () => {
  const input = candidate(); input.sources[0].publishedAt = input.window.start;
  assert.equal(validateEdition(input).valid, true);
  invalid(c => { c.sources[0].publishedAt = c.window.end; }, 'outside_window');
  invalid(c => { c.sources[0].publishedAt = '2026-01-13T23:59:59Z'; }, 'outside_window');
  for (const timestamp of [null, '2026-02-30T09:00:00Z', '2026-01-14T09:00:00+00:00', '2026-01-14T25:00:00Z']) {
    invalid(c => { c.sources[0].publishedAt = timestamp; }, 'invalid_timestamp');
  }
  invalid(c => { c.window.end = c.window.start; }, 'invalid_interval');
  invalid(c => { c.editionDate = '2026-02-30'; }, 'invalid_date');
});

test('unknown schema fields, malformed nested objects and invalid IDs fail closed', () => {
  invalid(c => { c.schemaVersion = 2; }, 'unsupported_version');
  invalid(c => { c.debug = 'unwanted'; }, 'fields_mismatch');
  invalid(c => { delete c.window; }, 'fields_mismatch');
  invalid(c => { c.events[0].facts[0] = null; }, 'object_required');
  invalid(c => { c.events[0].id = '../unsafe'; }, 'invalid_id');
  for (const input of [null, [], 7, {}, { schemaVersion: 1 }]) assert.equal(validateEdition(input).valid, false);
});

test('valid CLI is read-only and invalid diagnostics do not echo input or filenames', t => {
  const { file } = fixture(t);
  const original = fs.readFileSync(file, 'utf8');
  const success = spawnSync(process.execPath, [cli, file], { encoding: 'utf8' });
  assert.equal(success.status, 0); assert.equal(JSON.parse(success.stdout).valid, true);
  assert.equal(fs.readFileSync(file, 'utf8'), original);
  const marker = 'PRIVATE_MARKER_NOT_A_REAL_SECRET';
  fs.writeFileSync(file, '{"' + marker + '":');
  const failure = spawnSync(process.execPath, [cli, file], { encoding: 'utf8' });
  assert.equal(failure.status, 1); assert.equal(JSON.parse(failure.stdout).valid, false);
  assert.equal(failure.stderr, ''); assert.ok(!failure.stdout.includes(marker)); assert.ok(!failure.stdout.includes(file));
  const input = candidate(); input.sources[0].id = marker;
  const errors = JSON.stringify(validateEdition(input)); assert.ok(!errors.includes(marker));
  assert.equal(spawnSync(process.execPath, [cli], { encoding: 'utf8' }).status, 2);
});

test('CLI rejects oversized, symlink, directory, nonexistent and invalid UTF-8 inputs', t => {
  const { directory, file } = fixture(t);
  const link = path.join(directory, 'linked.json'); fs.symlinkSync(file, link);
  assert.equal(readCandidate(link).valid, false);
  assert.equal(readCandidate(directory).valid, false);
  assert.equal(readCandidate(path.join(directory, 'missing.json')).valid, false);
  fs.writeFileSync(file, Buffer.alloc(MAX_BYTES + 1, 32)); assert.equal(readCandidate(file).valid, false);
  fs.writeFileSync(file, Buffer.from([0xff])); assert.equal(readCandidate(file).valid, false);
});
