const fs = require('node:fs');
const { readJsonFile } = require('./check-edition.cjs');

const shape = (value, keys) => value && typeof value === 'object' && !Array.isArray(value) &&
  Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
function timestamp(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(value)) return NaN;
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString().replace('.000Z', 'Z') === value ? time : NaN;
}
function policyList(values, pattern, nonempty) {
  return Array.isArray(values) && (!nonempty || values.length > 0) && values.length <= 500 &&
    values.every(value => typeof value === 'string' && value.length <= 253 && pattern.test(value)) &&
    new Set(values).size === values.length;
}
function selectSources(input) {
  const invalid = () => ({ valid: false, errors: [{ code: 'invalid_selection_request' }] });
  if (!shape(input, ['schemaVersion', 'window', 'allowedHosts', 'trackingParameters', 'articles']) ||
      input.schemaVersion !== 1 || !shape(input.window, ['start', 'end'])) return invalid();
  const start = timestamp(input.window.start), end = timestamp(input.window.end);
  const host = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end ||
      !policyList(input.allowedHosts, host, true) ||
      !policyList(input.trackingParameters, /^[a-zA-Z0-9_-]+$/, false) ||
      !Array.isArray(input.articles) || input.articles.length > 500) return invalid();
  const groups = new Map(), rejected = [];
  const reject = (index, code) => rejected.push({ index, code });
  input.articles.forEach((article, index) => {
    if (!shape(article, ['url', 'publishedAt'])) { reject(index, 'invalid_record'); return; }
    let url;
    try {
      if (typeof article.url !== 'string' || /\s/.test(article.url)) throw new Error();
      url = new URL(article.url);
      if (url.protocol !== 'https:' || url.username || url.password || url.hash || url.port ||
          !input.allowedHosts.includes(url.hostname)) throw new Error();
    } catch { reject(index, 'invalid_or_disallowed_url'); return; }
    const time = timestamp(article.publishedAt);
    if (!Number.isFinite(time)) { reject(index, 'invalid_timestamp'); return; }
    const components = url.search ? url.search.slice(1).split('&') : [];
    const retained = components.filter(component => {
      const name = new URLSearchParams(component).keys().next().value;
      return !input.trackingParameters.includes(name);
    });
    url.search = retained.length ? `?${retained.join('&')}` : '';
    const key = url.href;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ index, url: article.url, publishedAt: article.publishedAt, time });
  });
  const accepted = [];
  for (const [normalizedUrl, records] of groups) {
    if (new Set(records.map(record => record.publishedAt)).size !== 1) {
      records.forEach(record => reject(record.index, 'conflicting_publication_dates'));
    } else if (records[0].time < start || records[0].time >= end) {
      records.forEach(record => reject(record.index, 'outside_window'));
    } else {
      accepted.push({ normalizedUrl, publishedAt: records[0].publishedAt,
        originals: records.map(({ index, url }) => ({ index, url })) });
    }
  }
  rejected.sort((a, b) => a.index - b.index);
  return { valid: true, errors: [], selection: { schemaVersion: 1,
    window: { ...input.window }, accepted, rejected } };
}
function selectFile(source, destination) {
  const loaded = readJsonFile(source);
  const result = Object.hasOwn(loaded, 'value') ? selectSources(loaded.value) : loaded;
  if (!result.valid) return result;
  try {
    fs.writeFileSync(destination, `${JSON.stringify(result.selection, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
  } catch { return { valid: false, errors: [{ code: 'output_file_unavailable' }] }; }
  return { valid: true, errors: [], accepted: result.selection.accepted.length,
    rejected: result.selection.rejected.length };
}
if (require.main === module) {
  const usage = process.argv.length !== 4;
  const result = usage ? { valid: false, errors: [{ code: 'usage_input_and_new_output_required' }] }
    : selectFile(process.argv[2], process.argv[3]);
  console.log(JSON.stringify(result));
  process.exitCode = usage ? 2 : result.valid ? 0 : 1;
}
module.exports = { selectSources, selectFile };
