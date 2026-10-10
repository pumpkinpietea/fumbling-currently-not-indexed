const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const YAML = require('yaml');
const { renderDrafts, writeDrafts } = require('../scripts/render-edition.cjs');

const repository = path.resolve(__dirname, '..');
const sample = path.join(__dirname, 'fixtures/render-valid.json');
const cli = path.join(repository, 'scripts/render-edition.cjs');
const filename = '2026-01-15-indonesia-news.md';
function request() { return JSON.parse(fs.readFileSync(sample, 'utf8')); }
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'news-drafts-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}
function invalid(mutator, code) {
  const input = request(); mutator(input);
  const result = renderDrafts(input);
  assert.equal(result.valid, false);
  assert.equal(result.files, undefined);
  assert.ok(result.errors.some(error => error.code === code), JSON.stringify(result));
}

test('renders deterministic draft metadata, known links and stable identity anchors', () => {
  const result = renderDrafts(request()); assert.equal(result.valid, true);
  assert.deepEqual(Object.keys(result.files), [`en/article/${filename}`, `jp/article/${filename}`]);
  for (const [file, body] of Object.entries(result.files)) {
    const metadata = YAML.parse(body.split('---\n')[1]);
    assert.equal(metadata.draft, true); assert.equal(metadata.date, '2026-01-15');
    assert.equal(metadata.slug, 'indonesia-news-2026-01-15');
    assert.equal(metadata.translationKey, metadata.slug);
    assert.match(body, /\{#event-event1\}/);
    assert.match(body, /\]\(<https:\/\/example\.com\/report>\)/);
    assert.ok(file.startsWith('en/') || file.startsWith('jp/'));
  }
  const reversed = request(); reversed.editions.reverse();
  assert.deepEqual(renderDrafts(reversed).files, result.files);
});

test('candidate event and fact order wins over reordered localized arrays', () => {
  const input = request();
  input.candidate.events[0].facts.push({ id: 'fact2', sourceIds: ['source1'] });
  input.candidate.events.push({ id: 'event2', sourceIds: ['source1'], facts: [{ id: 'fact3', sourceIds: ['source1'] }] });
  for (const edition of input.candidate.editions) {
    edition.events[0].factIds.push('fact2');
    edition.events.push({ id: 'event2', factIds: ['fact3'], sourceUrls: ['https://example.com/report'] });
  }
  for (const edition of input.editions) {
    edition.events[0].facts.push({ id: 'fact2', text: 'Second original example fact.' });
    edition.events.push({ id: 'event2', title: 'Another example', facts: [{ id: 'fact3', text: 'Third original example fact.' }] });
  }
  const expected = renderDrafts(input); assert.equal(expected.valid, true);
  for (const edition of input.editions) {
    edition.events.reverse(); for (const event of edition.events) event.facts.reverse();
  }
  assert.deepEqual(renderDrafts(input).files, expected.files);
});

test('rejects malformed envelopes, invalid candidates and unsupported site language', () => {
  invalid(r => { r.schemaVersion = 2; }, 'unsupported_version');
  invalid(r => { r.draft = false; }, 'fields_mismatch');
  invalid(r => { r.candidate.sources[0].publishedAt = r.candidate.window.end; }, 'outside_window');
  invalid(r => {
    r.candidate.languages = ['en', 'id']; r.candidate.editions[1].language = 'id'; r.editions[1].language = 'id';
  }, 'site_language_not_enabled');
});

test('rejects missing, duplicate and unknown localized languages/events/facts', () => {
  invalid(r => r.editions.pop(), 'coverage_mismatch');
  invalid(r => r.editions.push(structuredClone(r.editions[0])), 'duplicate_reference');
  invalid(r => { r.editions[1].language = 'other'; }, 'unknown_reference');
  invalid(r => { r.editions[0].events = []; }, 'coverage_mismatch');
  invalid(r => r.editions[0].events.push(structuredClone(r.editions[0].events[0])), 'duplicate_reference');
  invalid(r => { r.editions[0].events[0].id = 'unknown'; }, 'unknown_reference');
  invalid(r => { r.editions[1].events[0].facts = []; }, 'coverage_mismatch');
  invalid(r => r.editions[1].events[0].facts.push(structuredClone(r.editions[1].events[0].facts[0])), 'duplicate_reference');
  invalid(r => { r.editions[1].events[0].facts[0].id = 'invented'; }, 'unknown_reference');
});

test('requires literal single-line bounded text and prevents front matter/title injection', () => {
  for (const title of ['', ' '.repeat(4), 'x'.repeat(201), 'Title\ndraft: false', '{{< injected >}}', '<script>', '[link](https://example.com)', 'https://example.com']) {
    invalid(r => { r.editions[0].title = title; }, 'invalid_text');
  }
  for (const text of ['', 'x'.repeat(4001), 'two\nlines', 'control\u0000character']) {
    invalid(r => { r.editions[0].events[0].facts[0].text = text; }, 'invalid_text');
  }
  invalid(r => { r.editions[0].events[0].facts[0].url = 'https://example.com/invented'; }, 'fields_mismatch');
  const input = request(); input.editions[0].title = 'A: "quoted" & plain title';
  const result = renderDrafts(input);
  assert.equal(YAML.parse(result.files[`en/article/${filename}`].split('---\n')[1]).title, input.editions[0].title);
});

test('escapes untrusted body syntax and known source URL delimiters', () => {
  const input = request();
  input.editions[0].events[0].facts[0].text = '{{< injected >}} <script> [bad](https://invalid.example) **bold** & user@example.com';
  input.candidate.sources[0].url = 'https://example.com/report_(one)?template={{%injected%}}';
  for (const edition of input.candidate.editions) edition.events[0].sourceUrls = [input.candidate.sources[0].url];
  const result = renderDrafts(input); assert.equal(result.valid, true);
  const body = result.files[`en/article/${filename}`];
  for (const forbidden of ['{{', '<script>', '[bad]', '**bold**', 'https://invalid', 'user@example.com']) assert.ok(!body.includes(forbidden));
  assert.match(body, /https:\/\/example\.com\/report_%28one%29/);
  assert.ok(!body.includes('{{')); assert.match(body, /%7B%7B%injected%%7D%7D/);
});

test('writes only validated drafts to a new directory and preserves existing destinations', t => {
  const root = fixture(t); const output = path.join(root, 'content');
  assert.deepEqual(writeDrafts(request(), output), { valid: true, errors: [], files: 2 });
  const existing = fs.readFileSync(path.join(output, 'en/article', filename), 'utf8');
  assert.equal(writeDrafts(request(), output).valid, false);
  assert.equal(fs.readFileSync(path.join(output, 'en/article', filename), 'utf8'), existing);
  const link = path.join(root, 'link'); fs.symlinkSync(output, link);
  assert.equal(writeDrafts(request(), link).valid, false);
  const invalidInput = request(); invalidInput.editions.pop();
  const absent = path.join(root, 'absent');
  assert.equal(writeDrafts(invalidInput, absent).valid, false); assert.equal(fs.existsSync(absent), false);
});

test('CLI keeps diagnostics private, validates before writing and returns useful exit codes', t => {
  const root = fixture(t), output = path.join(root, 'content');
  const success = spawnSync(process.execPath, [cli, sample, output], { encoding: 'utf8' });
  assert.equal(success.status, 0); assert.equal(JSON.parse(success.stdout).files, 2);
  const repeat = spawnSync(process.execPath, [cli, sample, output], { encoding: 'utf8' });
  assert.equal(repeat.status, 1); assert.ok(!repeat.stdout.includes(root)); assert.equal(repeat.stderr, '');
  const file = path.join(root, 'private-input.json'); fs.writeFileSync(file, '{"PRIVATE_TEST_MARKER":');
  const invalid = spawnSync(process.execPath, [cli, file, path.join(root, 'absent')], { encoding: 'utf8' });
  assert.equal(invalid.status, 1); assert.ok(!invalid.stdout.includes('PRIVATE_TEST_MARKER'));
  assert.ok(!invalid.stdout.includes(file)); assert.equal(fs.existsSync(path.join(root, 'absent')), false);
  assert.equal(spawnSync(process.execPath, [cli], { encoding: 'utf8' }).status, 2);
});

test('real Hugo excludes drafts normally and previews escaped multilingual content with buildDrafts', t => {
  const root = fixture(t), content = path.join(root, 'content');
  const input = request(); input.editions[0].events[0].facts[0].text = '{{< injected >}} <script>alert(1)</script> [bad](https://invalid.example) user@example.com';
  assert.equal(writeDrafts(input, content).valid, true);
  function build(name, drafts) {
    const destination = path.join(root, name);
    const config = path.join(root, 'preview.yaml');
    fs.writeFileSync(config, YAML.stringify({ languages: { en: { contentDir: path.join(content, 'en') }, jp: { contentDir: path.join(content, 'jp') } } }));
    const result = spawnSync('hugo', ['--source', repository, '--config', `hugo.yaml,${config}`, '--destination', destination,
      '--cacheDir', path.join(root, 'cache'), ...(drafts ? ['--buildDrafts'] : [])], { encoding: 'utf8', timeout: 30000 });
    assert.equal(result.status, 0, result.stderr); return destination;
  }
  const relative = 'article/indonesia-news-2026-01-15/index.html';
  const normal = build('normal', false);
  assert.equal(fs.existsSync(path.join(normal, relative)), false);
  assert.equal(fs.existsSync(path.join(normal, 'jp', relative)), false);
  const preview = build('preview', true);
  for (const prefix of ['', 'jp']) {
    const file = path.join(preview, prefix, relative); assert.ok(fs.existsSync(file));
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, /id=(?:"event-event1"|event-event1)[ >]/);
    assert.match(html, /href=(?:"https:\/\/example\.com\/report"|https:\/\/example\.com\/report)[ >]/);
    assert.ok(!html.includes('href="https://invalid.example"')); assert.ok(!html.includes('href="mailto:user@example.com"'));
    const body = html.match(/<div class=(?:"post-content"|post-content)>([\s\S]*?)<\/div>/)?.[1];
    assert.ok(body); assert.ok(!body.includes('<script>'));
    assert.ok(!/href=["']?(?:https:\/\/invalid\.example|mailto:user@example\.com)/.test(body));
  }
  assert.match(fs.readFileSync(path.join(preview, relative), 'utf8'), /injected/);
});
