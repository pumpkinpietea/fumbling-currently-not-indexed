const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');
const { validateEdition, readJsonFile } = require('./check-edition.cjs');

function literal(text) {
  return text.replace(/[&<>\[\]{}()*_`~#!|@.\\:\-]/g, char => `&#${char.charCodeAt(0)};`);
}
function sourceLink(url) {
  return url.replace(/[<>()[\]\\{}"'`]/g, char => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

function renderDrafts(request) {
  const errors = [];
  const fail = (path, code) => errors.push({ path, code });
  const shape = (value, keys, path) => {
    if (!value || typeof value !== 'object' || Array.isArray(value) ||
        Object.keys(value).length !== keys.length || keys.some(key => !Object.hasOwn(value, key))) {
      fail(path, 'fields_mismatch'); return false;
    }
    return true;
  };
  const text = (value, limit, path, title = false) => {
    if (typeof value !== 'string' || !value.trim() || value.length > limit || /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/u.test(value) ||
        (title && /[<>{}\[\]`*_~\\]|https?:\/\/|www\./i.test(value))) fail(path, 'invalid_text');
  };
  const index = (items, ids, key, itemKeys, itemPath, inspect) => {
    const result = new Map();
    if (!Array.isArray(items)) { fail(itemPath, 'array_required'); return result; }
    items.forEach((item, i) => {
      const entryPath = `${itemPath}[${i}]`;
      if (!shape(item, itemKeys, entryPath)) return;
      if (typeof item[key] !== 'string' || !ids.has(item[key])) fail(`${entryPath}.${key}`, 'unknown_reference');
      if (result.has(item[key])) fail(`${entryPath}.${key}`, 'duplicate_reference');
      result.set(item[key], inspect(item, entryPath));
    });
    if (result.size !== ids.size || [...ids].some(id => !result.has(id))) fail(itemPath, 'coverage_mismatch');
    return result;
  };
  if (!shape(request, ['schemaVersion', 'candidate', 'editions'], '$')) return { valid: false, errors };
  if (request.schemaVersion !== 1) fail('$.schemaVersion', 'unsupported_version');
  const contract = validateEdition(request.candidate);
  if (!contract.valid) {
    for (const error of contract.errors) fail(`$.candidate${error.path.slice(1)}`, error.code);
    return { valid: false, errors };
  }
  const candidate = request.candidate;
  if (candidate.languages.some(language => !['en', 'jp'].includes(language))) fail('$.candidate.languages', 'site_language_not_enabled');
  const events = new Map(candidate.events.map(event => [event.id, event]));
  const localized = index(request.editions, new Set(candidate.languages), 'language', ['language', 'title', 'events'], '$.editions', (edition, editionPath) => {
    text(edition.title, 200, `${editionPath}.title`, true);
    const entries = index(edition.events, new Set(events.keys()), 'id', ['id', 'title', 'facts'], `${editionPath}.events`, (entry, entryPath) => {
      text(entry.title, 200, `${entryPath}.title`, true);
      const facts = index(entry.facts, new Set((events.get(entry.id)?.facts || []).map(fact => fact.id)), 'id', ['id', 'text'], `${entryPath}.facts`, (fact, factPath) => {
        text(fact.text, 4000, `${factPath}.text`); return fact.text;
      });
      return { title: entry.title, facts };
    });
    return { title: edition.title, entries };
  });
  if (errors.length) return { valid: false, errors };
  const sources = new Map(candidate.sources.map(source => [source.id, source.url]));
  const slug = `indonesia-news-${candidate.editionDate}`;
  const files = {};
  for (const language of candidate.languages) {
    const edition = localized.get(language);
    const heading = language === 'jp' ? 'ニュースダイジェスト' : 'News digest';
    const sourceLabel = language === 'jp' ? '出典' : 'Source';
    const metadata = YAML.stringify({ title: edition.title, date: candidate.editionDate, slug,
      translationKey: slug, categories: ['Indonesia', 'News'], draft: true });
    const sections = candidate.events.map(event => {
      const entry = edition.entries.get(event.id);
      const facts = event.facts.map(fact => `- ${literal(entry.facts.get(fact.id))}`).join('\n');
      const links = event.sourceIds.map((id, i) => `[${sourceLabel} ${i + 1}](<${sourceLink(sources.get(id))}>)`).join(' · ');
      return `## ${literal(entry.title)} {#event-${event.id}}\n\n${facts}\n\n${links}`;
    });
    files[`${language}/article/${candidate.editionDate}-indonesia-news.md`] = `---\n${metadata}---\n\n# ${heading}\n\n${sections.join('\n\n')}\n`;
  }
  return { valid: true, errors: [], files };
}

function writeDrafts(request, destination) {
  const result = renderDrafts(request);
  if (!result.valid) return result;
  let created = false;
  try {
    fs.mkdirSync(destination); created = true;
    for (const [relative, contents] of Object.entries(result.files)) {
      const file = path.join(destination, relative);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, contents, { flag: 'wx' });
    }
    return { valid: true, errors: [], files: Object.keys(result.files).length };
  } catch {
    if (created) {
      try { fs.rmSync(destination, { recursive: true, force: true }); } catch { /* Preserve a failed staging directory for local recovery. */ }
    }
    return { valid: false, errors: [{ path: '$', code: 'output_directory_unavailable' }] };
  }
}

if (require.main === module) {
  let result;
  if (process.argv.length !== 4) result = { valid: false, errors: [{ path: '$', code: 'usage_json_file_and_new_directory_required' }] };
  else {
    const input = readJsonFile(process.argv[2]);
    result = Object.hasOwn(input, 'value') ? writeDrafts(input.value, process.argv[3]) : input;
  }
  console.log(JSON.stringify(result));
  process.exitCode = process.argv.length !== 4 ? 2 : result.valid ? 0 : 1;
}
module.exports = { renderDrafts, writeDrafts };
