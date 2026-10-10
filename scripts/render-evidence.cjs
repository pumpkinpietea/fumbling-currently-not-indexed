const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { readJsonFile } = require('./check-edition.cjs');
const { renderDrafts } = require('./render-edition.cjs');
const ID = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/;
const sha256 = value => createHash('sha256').update(value, 'utf8').digest('hex');
const numericStrings = value => [...new Set(value.normalize('NFKC').match(/\p{N}+(?:[.,]\p{N}+)*/gu) || [])].sort();
function timestamp(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(value)) return NaN;
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString().replace('.000Z', 'Z') === value ? time : NaN;
}
function buildEvidenceDrafts(input) {
  const errors = [];
  const fail = (location, code) => errors.push({ path: location, code });
  const invalid = () => ({ valid: false, errors });
  const shape = (value, keys, location) => {
    if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length !== keys.length ||
        keys.some(key => !Object.hasOwn(value, key))) { fail(location, 'fields_mismatch'); return false; }
    return true;
  };
  const list = (value, limit, location) => {
    if (!Array.isArray(value) || !value.length || value.length > limit) {
      fail(location, 'array_bounds'); return false;
    }
    return true;
  };
  const text = (value, limit, singleLine = false) => typeof value === 'string' && value.trim().length > 0 &&
    value.length <= limit && value.isWellFormed() && (!singleLine || !/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/.test(value));
  const identity = (value, seen, location) => {
    if (typeof value !== 'string' || !ID.test(value) || seen.has(value)) fail(location, 'invalid_or_duplicate_id');
    else seen.add(value);
  };
  if (!shape(input, ['schemaVersion', 'editionDate', 'window', 'languages', 'sources', 'events', 'editions'], '$')) return invalid();
  if (input.schemaVersion !== 1) fail('$.schemaVersion', 'unsupported_version');
  const sources = new Map(), sourceIds = new Set();
  if (list(input.sources, 50, '$.sources')) for (const [i, source] of input.sources.entries()) {
    const location = `$.sources[${i}]`;
    if (!shape(source, ['id', 'url', 'publishedAt', 'retrievedAt', 'method', 'body', 'sha256'], location)) continue;
    identity(source.id, sourceIds, `${location}.id`);
    if (!['article_body', 'primary_release'].includes(source.method)) fail(`${location}.method`, 'body_evidence_required');
    const published = timestamp(source.publishedAt), retrieved = timestamp(source.retrievedAt);
    if (!Number.isFinite(published) || !Number.isFinite(retrieved) || retrieved < published) fail(location, 'invalid_source_chronology');
    if (!text(source.body, 50000)) fail(`${location}.body`, 'invalid_body');
    else if (typeof source.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(source.sha256) || sha256(source.body) !== source.sha256) {
      fail(`${location}.sha256`, 'body_hash_mismatch');
    }
    sources.set(source.id, source);
  }
  if (errors.length) return invalid();
  const events = [], facts = new Map(), eventIds = new Set(), factIds = new Set();
  let factCount = 0;
  if (list(input.events, 50, '$.events')) for (const [i, event] of input.events.entries()) {
    const location = `$.events[${i}]`;
    if (!shape(event, ['id', 'facts'], location)) continue;
    identity(event.id, eventIds, `${location}.id`);
    if (!list(event.facts, 200, `${location}.facts`)) continue;
    factCount += event.facts.length;
    if (factCount > 200) { fail('$.events', 'fact_budget_exceeded'); return invalid(); }
    const eventSources = new Set(), candidateFacts = [];
    for (const [j, fact] of event.facts.entries()) {
      const factPath = `${location}.facts[${j}]`;
      if (!shape(fact, ['id', 'claim', 'evidence'], factPath)) continue;
      identity(fact.id, factIds, `${factPath}.id`);
      const claimValid = text(fact.claim, 2000, true);
      if (!claimValid) fail(`${factPath}.claim`, 'invalid_claim');
      if (!list(fact.evidence, 5, `${factPath}.evidence`)) continue;
      const cited = new Set(), spans = new Set(), quoteNumbers = new Set();
      for (const [k, citation] of fact.evidence.entries()) {
        const citePath = `${factPath}.evidence[${k}]`;
        if (!shape(citation, ['sourceId', 'start', 'end', 'quote'], citePath)) continue;
        const source = sources.get(citation.sourceId);
        if (!source) { fail(citePath, 'unknown_source'); continue; }
        if (!Number.isInteger(citation.start) || !Number.isInteger(citation.end) || citation.start < 0 ||
            citation.end <= citation.start || citation.end > source.body.length || !text(citation.quote, 2000) ||
            source.body.slice(citation.start, citation.end) !== citation.quote) {
          fail(citePath, 'quote_span_mismatch'); continue;
        }
        const span = `${citation.sourceId}:${citation.start}:${citation.end}`;
        if (spans.has(span)) fail(citePath, 'duplicate_citation');
        spans.add(span);
        cited.add(source.id); eventSources.add(source.id);
        numericStrings(citation.quote).forEach(number => quoteNumbers.add(number));
      }
      if (claimValid && numericStrings(fact.claim).some(number => !quoteNumbers.has(number))) fail(factPath, 'unsupported_claim_number');
      candidateFacts.push({ id: fact.id, sourceIds: input.sources.filter(source => cited.has(source.id)).map(source => source.id) });
      facts.set(fact.id, { ...fact, eventId: event.id });
    }
    events.push({ id: event.id, sourceIds: input.sources.filter(source => eventSources.has(source.id)).map(source => source.id), facts: candidateFacts });
  }
  if (errors.length) return invalid();
  const candidate = { schemaVersion: 1, editionDate: input.editionDate, window: input.window, languages: input.languages,
    sources: input.sources.map(({ id, url, publishedAt }) => ({ id, url, publishedAt })), events,
    editions: Array.isArray(input.languages) ? input.languages.map(language => ({ language,
      events: events.map(event => ({ id: event.id, factIds: event.facts.map(fact => fact.id),
        sourceUrls: event.sourceIds.map(id => sources.get(id).url) })) })) : [] };
  const rendered = renderDrafts({ schemaVersion: 1, candidate, editions: input.editions });
  if (!rendered.valid) return rendered;
  for (const [i, edition] of input.editions.entries()) for (const [j, event] of edition.events.entries()) {
    for (const [k, fact] of event.facts.entries()) {
      if (JSON.stringify(numericStrings(fact.text)) !== JSON.stringify(numericStrings(facts.get(fact.id).claim))) {
        fail(`$.editions[${i}].events[${j}].facts[${k}]`, 'localized_numbers_mismatch');
      }
    }
  }
  if (errors.length) return invalid();
  const audit = { schemaVersion: 1, editionDate: input.editionDate, window: { ...input.window },
    sources: input.sources.map(({ id, url, publishedAt, retrievedAt, method, sha256: hash }) =>
      ({ id, url, publishedAt, retrievedAt, method, bodySha256: hash })),
    facts: [...facts.values()].map(fact => ({ id: fact.id, eventId: fact.eventId, claimSha256: sha256(fact.claim),
      evidence: fact.evidence.map(({ sourceId, start, end, quote }) => ({ sourceId, start, end, quoteSha256: sha256(quote) })) })),
    files: Object.entries(rendered.files).map(([relative, contents]) => ({ path: relative, sha256: sha256(contents) })) };
  return { valid: true, errors: [], files: rendered.files, audit };
}
function writeEvidenceDrafts(input, destination) {
  const result = buildEvidenceDrafts(input);
  if (!result.valid) return result;
  let created = false;
  try {
    fs.mkdirSync(destination, { mode: 0o700 }); created = true;
    for (const [relative, contents] of Object.entries(result.files)) {
      const file = path.join(destination, relative);
      fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
      fs.writeFileSync(file, contents, { flag: 'wx', mode: 0o600 });
    }
    fs.writeFileSync(path.join(destination, 'evidence-audit.json'), `${JSON.stringify(result.audit, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
    return { valid: true, errors: [], drafts: Object.keys(result.files).length, audit: true };
  } catch {
    if (created) {
      try { fs.rmSync(destination, { recursive: true, force: true }); } catch { /* Preserve failed staging for local recovery. */ }
    }
    return { valid: false, errors: [{ path: '$', code: 'output_directory_unavailable' }] };
  }
}
if (require.main === module) {
  const usage = process.argv.length !== 4;
  let result = { valid: false, errors: [{ path: '$', code: 'usage_input_and_new_directory_required' }] };
  if (!usage) {
    const loaded = readJsonFile(process.argv[2]);
    result = Object.hasOwn(loaded, 'value') ? writeEvidenceDrafts(loaded.value, process.argv[3]) : loaded;
  }
  console.log(JSON.stringify(result));
  process.exitCode = usage ? 2 : result.valid ? 0 : 1;
}
module.exports = { buildEvidenceDrafts, writeEvidenceDrafts };
