const fs = require('node:fs');
const { readJsonFile } = require('./check-edition.cjs');
const { selectSources } = require('./select-sources.cjs');
const { parseRss } = require('./rss-metadata.cjs');
const { fetchFeed } = require('./feed-transport.cjs');
const registry = require('../config/news-sources.json');
const FEEDS = Object.freeze(Object.fromEntries(registry.sources
  .filter(source => source.reviewStatus === 'private_metadata_trial')
  .flatMap(source => source.feeds.map(feed => [feed.id, feed]))));
const MAX_COLLECTION_RECORDS = 500;
const shape = (value, keys) => value && typeof value === 'object' && !Array.isArray(value) &&
  Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
function selectionRequest(window, articles = [], hosts = ['www.antaranews.com']) {
  return { schemaVersion: 1, window, allowedHosts: hosts,
    trackingParameters: [], articles };
}
function validRequest(input) {
  return shape(input, ['schemaVersion', 'window', 'feeds']) && input.schemaVersion === 1 &&
    selectSources(selectionRequest(input.window)).valid && Array.isArray(input.feeds) &&
    input.feeds.length >= 1 && input.feeds.length <= 8 && new Set(input.feeds).size === input.feeds.length &&
    input.feeds.every(id => typeof id === 'string' && Object.hasOwn(FEEDS, id));
}
async function collectFeeds(input, { fetch = fetchFeed, now = () => new Date() } = {}) {
  if (!validRequest(input)) return { valid: false, errors: [{ code: 'invalid_collection_request' }] };
  const report = { schemaVersion: 1, collectedAt: now().toISOString(), complete: true, feeds: [], records: [] };
  for (const id of input.feeds) {
    let parsed;
    try { parsed = parseRss(await fetch(FEEDS[id].url), { allowFullMonthNames: FEEDS[id].fullMonthNames === true, includeDescription: FEEDS[id].includeDescription === true }); }
    catch (error) {
      const known = ['feed_timeout', 'feed_dns_rejected', 'feed_network_error',
        'feed_response_rejected', 'feed_size_limit', 'feed_request_rejected'];
      parsed = { valid: false, code: known.includes(error.message) ? error.message : 'feed_retrieval_failed' };
    }
    if (parsed.valid && report.records.length + parsed.records.length > MAX_COLLECTION_RECORDS) {
      parsed = { valid: false, code: 'collection_record_limit' };
    }
    if (!parsed.valid) {
      report.complete = false;
      report.feeds.push({ id, url: FEEDS[id].url, status: 'failed', itemCount: 0, error: parsed.code });
    } else {
      report.feeds.push({ id, url: FEEDS[id].url, status: 'ok', itemCount: parsed.records.length, error: null });
      report.records.push(...parsed.records.map(record => ({ feedId: id, ...record })));
    }
  }
  report.selection = selectSources(selectionRequest(input.window,
    report.records.map(({ feedId, url, publishedAt }) => {
      let allowed = false;
      try { allowed = FEEDS[feedId].allowedHosts.includes(new URL(url).hostname); } catch { /* Reject below. */ }
      return { url: allowed ? url : null, publishedAt };
    }), [...new Set(input.feeds.flatMap(id => FEEDS[id].allowedHosts))])).selection;
  return { valid: true, errors: [], report };
}
async function collectFile(source, destination, dependencies) {
  const loaded = readJsonFile(source);
  if (!Object.hasOwn(loaded, 'value')) return loaded;
  if (!validRequest(loaded.value)) return { valid: false, errors: [{ code: 'invalid_collection_request' }] };
  try {
    fs.lstatSync(destination);
    return { valid: false, errors: [{ code: 'output_file_unavailable' }] };
  } catch (error) {
    if (error.code !== 'ENOENT') return { valid: false, errors: [{ code: 'output_file_unavailable' }] };
  }
  const result = await collectFeeds(loaded.value, dependencies);
  try {
    fs.writeFileSync(destination, `${JSON.stringify(result.report, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
  } catch { return { valid: false, errors: [{ code: 'output_file_unavailable' }] }; }
  return { valid: result.report.complete, errors: result.report.complete ? [] : [{ code: 'collection_incomplete' }],
    feeds: result.report.feeds.length, failedFeeds: result.report.feeds.filter(feed => feed.status === 'failed').length,
    accepted: result.report.selection.accepted.length, rejected: result.report.selection.rejected.length };
}
if (require.main === module) {
  const usage = process.argv.length !== 4;
  Promise.resolve(usage ? { valid: false, errors: [{ code: 'usage_input_and_new_output_required' }] }
    : collectFile(process.argv[2], process.argv[3])).catch(() => ({ valid: false, errors: [{ code: 'collection_failed' }] }))
    .then(result => { console.log(JSON.stringify(result)); process.exitCode = usage ? 2 : result.valid ? 0 : 1; });
}
module.exports = { collectFeeds, collectFile, validRequest };
