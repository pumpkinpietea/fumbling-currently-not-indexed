const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { extractRssEvidence } = require('../scripts/news-evidence.cjs');
const { validateEvents, validateBundle, renderEdition, shortlist, produce } = require('../scripts/daily-news.cjs');
const settings = require('../config/news-publishing.json');
const record = { url: 'https://www.antaranews.com/berita/1234567/indonesia-digital-services',
  title: 'Indonesia expands digital services', publishedAt: '2026-10-10T04:00:00Z',
  description: '<p>Indonesia announced a digital services initiative. The ministry described its plans.</p>' };
const source = extractRssEvidence(record);
const event = { sourceIds: [source.id],
  en: { title: 'Indonesia announces digital services plans', summary: 'Indonesia announced a digital services initiative, according to the ministry.' },
  jp: { title: 'インドネシア、デジタルサービスの計画を発表', summary: 'インドネシアの省はデジタルサービスに関する取り組みを発表しました。' },
  quotes: [{ sourceId: source.id, text: 'Indonesia announced a digital services initiative.' }] };
const copy = value => structuredClone(value);
test('RSS evidence strips markup, rejects arbitrary hosts and insufficient excerpts', () => {
  assert.ok(source.excerpt.includes('Indonesia announced'));assert.ok(!source.excerpt.includes('<p>'));
  assert.throws(() => extractRssEvidence({ ...record, url: 'https://127.0.0.1/berita/1234567/a' }));
  assert.throws(() => extractRssEvidence({ ...record, description: 'Too short' }));
});
test('grounding and translation checks reject fabricated quotes, numbers, duplicate sources and markup', () => {
  assert.equal(validateEvents([event], [source]).length, 1);
  for (const alter of [e => { e.quotes[0].text = 'An invented quote absent from this evidence'; },
    e => { e.en.summary += ' It opened 25 stores.'; }, e => { e.jp.title += '<script>'; }]) {
    const e = copy(event);alter(e);assert.throws(() => validateEvents([e], [source]));
  }
  assert.throws(() => validateEvents([event, event], [source]));
});
test('publication bundle binds review, dates, source hash and exactly rendered files', () => {
  const bundle = { schemaVersion: 1, editionDate: '2026-10-11', revision: 'a'.repeat(40), sources: [source],
    events: [event], review: { approved: true, checkedIds: [source.id] }, files: renderEdition('2026-10-11', [event], [source]) };
  assert.equal(Object.keys(validateBundle(bundle, '2026-10-11')).length, 2);
  for (const change of [b => { b.review.approved = false; }, b => { b.sources[0].excerpt += 'changed'; },
    b => { b.files['content/en/article/2026-10-11-southeast-asia-tech.md'] += 'extra'; },
    b => { b.sources[0].publishedAt = '2026-10-09T04:00:00Z'; }]) {
    const b = copy(bundle);change(b);assert.throws(() => validateBundle(b, '2026-10-11'));
  }
});
test('shortlist uses normalized accepted URLs, topic filtering and previous publication URLs', () => {
  const accepted = [{ normalizedUrl: record.url }];
  assert.equal(shortlist([record], accepted, []).length, 1);
  assert.equal(shortlist([record], accepted, [record.url]).length, 0);
  assert.equal(shortlist([{ ...record, title: 'Football match results', description: 'Football match results in Indonesia.' }], accepted, []).length, 0);
});
function harness({ records = [record], complete = true, rejectReview = false, failure } = {}) {
  const objects = new Map([['auth/session.json', { value: { refresh_token: 'synthetic-runtime-fixture' }, generation: '1' }]]);
  let calls = 0;
  const state = { async read(name) { return objects.get(name) || null; },
    async write(name, value, generation = '0') {
      if (generation === '0' && objects.has(name)) throw new Error('state_already_exists');
      objects.set(name, { value, generation: '2' });return '2';
    } };
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'news-runtime-test-'));fs.chmodSync(directory, 0o700);
  const options = { instant: new Date('2026-10-11T00:30:00Z'), replayDate: '2026-10-11', trial: true,
    state, workDirectory: directory, credentialFile: path.join(directory, 'session.json'), model: 'fixture', revision: 'a'.repeat(40),
    collect: async () => ({ valid: true, report: { complete, records, selection: { accepted: records.map(r => ({ normalizedUrl: r.url })) } } }),
    body: async () => source,
    infer: async (request, credential, output, hooks) => {
      calls++;await hooks.onCredentialsSaved({ rotated: calls });
      if (failure) return { valid: false };
      const value = calls === 1 ? { events: [event] } : { approved: !rejectReview, checkedIds: [source.id] };
      fs.writeFileSync(output, JSON.stringify({ text: JSON.stringify(value) }));return { valid: true };
    } };
  return { objects, options, calls: () => calls, cleanup: () => fs.rmSync(directory, { recursive: true, force: true }) };
}
test('trial persists rotation before inference, requires review and never emits a publication bundle', async () => {
  const h = harness();try {
    assert.equal((await produce(h.options)).status, 'trial_passed');assert.equal(h.calls(), 2);
    assert.equal(h.objects.get('auth/session.json').value.rotated, 2);
    assert.ok(!h.objects.has('bundles/2026-10-11.json'));
    const retained = h.objects.get('evidence/trial-bundle-2026-10-11.json').value;
    assert.deepEqual(validateBundle(retained, '2026-10-11'), renderEdition('2026-10-11', [event], [source]));
    await assert.rejects(produce(h.options), /state_already_exists/);
  } finally { h.cleanup(); }
});
test('no-news, partial feeds, failed generation and rejected review never publish', async () => {
  for (const config of [{ records: [] }, { complete: false }, { failure: true }, { rejectReview: true }]) {
    const h = harness(config);try {
      if (config.records) { assert.equal((await produce(h.options)).status, 'no_news');assert.equal(h.calls(), 0); }
      else await assert.rejects(produce(h.options));
      assert.ok(!h.objects.has('bundles/2026-10-11.json'));
      if (config.failure) assert.equal(h.objects.get('auth/session.json').value.rotated, 1);
    } finally { h.cleanup(); }
  }
});
test('inactive scheduled execution fails before any collection or state mutation', async () => {

  const h = harness();try { await assert.rejects(produce({ ...h.options, replayDate: undefined, trial: false, config: { ...settings, enabled: false } }), /publication_not_active/);assert.equal(h.calls(), 0); }
  finally { h.cleanup(); }
});
test('metadata-only trial cannot read app credentials or invoke AI even with eligible evidence', async () => {
  const h = harness();const read = h.options.state.read;
  h.options.state.read = async name => { assert.notEqual(name, 'auth/session.json');return read(name); };
  h.options.infer = async () => assert.fail('metadata trial must never invoke AI');
  try {
    const result = await produce({ ...h.options, metadataOnly: true });
    assert.equal(result.status, 'metadata_trial_passed');assert.equal(result.sources, 1);assert.equal(result.modelCalls, 0);
    assert.ok(!h.objects.has('bundles/2026-10-11.json'));
  } finally { h.cleanup(); }
});
