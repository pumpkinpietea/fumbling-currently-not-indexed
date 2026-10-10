const fs = require('node:fs');

const MAX_BYTES = 1024 * 1024;
const ID = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/;

function validateEdition(input) {
  const errors = [];
  const fail = (path, code) => errors.push({ path, code });
  const shape = (value, keys, path) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      fail(path, 'object_required'); return false;
    }
    if (Object.keys(value).length !== keys.length || keys.some(key => !Object.hasOwn(value, key))) {
      fail(path, 'fields_mismatch'); return false;
    }
    return true;
  };
  const list = (value, path) => {
    if (!Array.isArray(value) || value.length === 0) {
      fail(path, 'nonempty_array_required'); return false;
    }
    return true;
  };
  const identity = (value, path, seen) => {
    if (typeof value !== 'string' || !ID.test(value)) { fail(path, 'invalid_id'); return false; }
    if (seen.has(value)) { fail(path, 'duplicate_id'); return false; }
    seen.add(value); return true;
  };
  const timestamp = (value, path) => {
    const time = typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(value)
      ? Date.parse(value) : NaN;
    if (!Number.isFinite(time) || new Date(time).toISOString().replace('.000Z', 'Z') !== value) {
      fail(path, 'invalid_timestamp'); return NaN;
    }
    return time;
  };
  const refs = (values, allowed, path) => {
    if (!list(values, path)) return;
    const seen = new Set();
    values.forEach((value, index) => {
      if (typeof value !== 'string' || !allowed.has(value)) fail(`${path}[${index}]`, 'unknown_reference');
      if (seen.has(value)) fail(`${path}[${index}]`, 'duplicate_reference');
      seen.add(value);
    });
  };
  const exact = (values, allowed, path) => {
    refs(values, allowed, path);
    if (!Array.isArray(values) || allowed.size !== new Set(values).size ||
        [...allowed].some(value => !values.includes(value))) fail(path, 'coverage_mismatch');
  };
  if (!shape(input, ['schemaVersion', 'editionDate', 'window', 'languages', 'sources', 'events', 'editions'], '$')) {
    return { valid: false, errors };
  }
  if (input.schemaVersion !== 1) fail('$.schemaVersion', 'unsupported_version');
  const date = input.editionDate;
  if (typeof date !== 'string' || !/^\d{4}-\d\d-\d\d$/.test(date) ||
      !Number.isFinite(Date.parse(`${date}T00:00:00Z`)) ||
      new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date) {
    fail('$.editionDate', 'invalid_date');
  }
  let start = NaN, end = NaN;
  if (shape(input.window, ['start', 'end'], '$.window')) {
    start = timestamp(input.window.start, '$.window.start');
    end = timestamp(input.window.end, '$.window.end');
    if (Number.isFinite(start) && Number.isFinite(end) && start >= end) fail('$.window', 'invalid_interval');
  }
  const languages = new Set();
  if (list(input.languages, '$.languages')) input.languages.forEach((language, i) => {
    if (!['en', 'jp', 'id'].includes(language)) fail(`$.languages[${i}]`, 'unsupported_language');
    identity(language, `$.languages[${i}]`, languages);
  });
  const sources = new Map(), sourceIds = new Set(), urls = new Set();
  if (list(input.sources, '$.sources')) input.sources.forEach((source, i) => {
    const path = `$.sources[${i}]`;
    if (!shape(source, ['id', 'url', 'publishedAt'], path)) return;
    const unique = identity(source.id, `${path}.id`, sourceIds);
    try {
      if (typeof source.url !== 'string') throw new Error();
      const url = new URL(source.url);
      if (url.protocol !== 'https:' || url.username || url.password || url.hash || /\s/.test(source.url)) throw new Error();
      if (urls.has(url.href)) fail(`${path}.url`, 'duplicate_url');
      urls.add(url.href);
    } catch { fail(`${path}.url`, 'invalid_source_url'); }
    const time = timestamp(source.publishedAt, `${path}.publishedAt`);
    if (Number.isFinite(time) && Number.isFinite(start) && Number.isFinite(end) && (time < start || time >= end)) {
      fail(`${path}.publishedAt`, 'outside_window');
    }
    if (unique) sources.set(source.id, source);
  });
  const events = new Map(), eventIds = new Set(), factIds = new Set(), usedSources = new Set();
  if (list(input.events, '$.events')) input.events.forEach((event, i) => {
    const path = `$.events[${i}]`;
    if (!shape(event, ['id', 'sourceIds', 'facts'], path)) return;
    const unique = identity(event.id, `${path}.id`, eventIds);
    refs(event.sourceIds, sourceIds, `${path}.sourceIds`);
    const eventSources = new Set(Array.isArray(event.sourceIds) ? event.sourceIds : []);
    const ownFacts = new Set(), cited = new Set();
    if (list(event.facts, `${path}.facts`)) event.facts.forEach((fact, j) => {
      const factPath = `${path}.facts[${j}]`;
      if (!shape(fact, ['id', 'sourceIds'], factPath)) return;
      if (identity(fact.id, `${factPath}.id`, factIds)) ownFacts.add(fact.id);
      refs(fact.sourceIds, eventSources, `${factPath}.sourceIds`);
      if (Array.isArray(fact.sourceIds)) fact.sourceIds.forEach(id => cited.add(id));
    });
    exact(event.sourceIds, cited, `${path}.sourceIds`);
    for (const id of eventSources) usedSources.add(id);
    if (unique) events.set(event.id, { facts: ownFacts, urls: new Set([...eventSources].map(id => sources.get(id)?.url)) });
  });
  if (sourceIds.size !== usedSources.size || [...sourceIds].some(id => !usedSources.has(id))) {
    fail('$.sources', 'unused_sources');
  }
  const editions = new Set();
  if (list(input.editions, '$.editions')) input.editions.forEach((edition, i) => {
    const path = `$.editions[${i}]`;
    if (!shape(edition, ['language', 'events'], path)) return;
    identity(edition.language, `${path}.language`, editions);
    if (!languages.has(edition.language)) fail(`${path}.language`, 'unknown_language');
    const outputIds = [];
    if (list(edition.events, `${path}.events`)) edition.events.forEach((event, j) => {
      const eventPath = `${path}.events[${j}]`;
      if (!shape(event, ['id', 'factIds', 'sourceUrls'], eventPath)) return;
      outputIds.push(event.id);
      const accepted = events.get(event.id);
      if (!accepted) { fail(`${eventPath}.id`, 'unknown_event'); return; }
      exact(event.factIds, accepted.facts, `${eventPath}.factIds`);
      exact(event.sourceUrls, accepted.urls, `${eventPath}.sourceUrls`);
    });
    exact(outputIds, eventIds, `${path}.events`);
  });
  if (languages.size !== editions.size || [...languages].some(language => !editions.has(language))) {
    fail('$.editions', 'language_coverage_mismatch');
  }
  return { valid: errors.length === 0, errors };
}

function readCandidate(file) {
  let descriptor;
  try {
    descriptor = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW | fs.constants.O_NONBLOCK);
    const stat = fs.fstatSync(descriptor);
    if (!stat.isFile() || stat.size > MAX_BYTES) throw new Error();
    const buffer = Buffer.alloc(MAX_BYTES + 1);
    let size = 0, count;
    while (size < buffer.length && (count = fs.readSync(descriptor, buffer, size, buffer.length - size, null)) > 0) size += count;
    if (size > MAX_BYTES) throw new Error();
    return validateEdition(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(buffer.subarray(0, size))));
  } catch {
    return { valid: false, errors: [{ path: '$', code: 'unreadable_or_invalid_json' }] };
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor);
  }
}

if (require.main === module) {
  const result = process.argv.length === 3 ? readCandidate(process.argv[2])
    : { valid: false, errors: [{ path: '$', code: 'usage_one_json_file_required' }] };
  console.log(JSON.stringify(result));
  process.exitCode = process.argv.length !== 3 ? 2 : result.valid ? 0 : 1;
}
module.exports = { validateEdition, readCandidate, MAX_BYTES };
