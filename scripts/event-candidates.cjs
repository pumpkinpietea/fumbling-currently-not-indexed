const fs = require('node:fs');
const { readJsonFile } = require('./check-edition.cjs');
const ALGORITHM = 'title-bigram-dice-v1';
const ID = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/;
const shape = (value, keys) => value && typeof value === 'object' && !Array.isArray(value) &&
  Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
const invalid = () => ({ valid: false, errors: [{ code: 'invalid_event_request' }] });
function timestamp(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(value)) return NaN;
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString().replace('.000Z', 'Z') === value ? time : NaN;
}
function validPolicy(policy) {
  return shape(policy, ['minimumSimilarity', 'maxGapHours', 'maxPairs']) &&
    Number.isFinite(policy.minimumSimilarity) && policy.minimumSimilarity >= 0 && policy.minimumSimilarity <= 1 &&
    Number.isFinite(policy.maxGapHours) && policy.maxGapHours >= 0 && policy.maxGapHours <= 168 &&
    Number.isInteger(policy.maxPairs) && policy.maxPairs >= 1 && policy.maxPairs <= 1000;
}
function features(title) {
  const text = title.normalize('NFKC').toLowerCase();
  const normalized = text.replace(/[^\p{L}\p{N}]/gu, '');
  const characters = Array.from(normalized);
  const grams = new Set(characters.length === 1 ? characters :
    characters.slice(1).map((character, index) => characters[index] + character));
  const numbers = [...new Set(text.match(/\p{N}+(?:[.,]\p{N}+)*/gu) || [])].sort();
  return { normalized, grams, numbers: JSON.stringify(numbers) };
}
function validArticle(article) {
  return shape(article, ['id', 'title', 'language', 'publishedAt']) &&
    typeof article.id === 'string' && ID.test(article.id) &&
    typeof article.title === 'string' && article.title.length <= 500 &&
    !/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/.test(article.title) &&
    features(article.title).grams.size > 0 && ['en', 'jp', 'id'].includes(article.language) &&
    Number.isFinite(timestamp(article.publishedAt));
}
const asciiOrder = (left, right) => left < right ? -1 : left > right ? 1 : 0;
const rounded = value => Math.round(value * 1000000) / 1000000;
function shortlistEvents(input) {
  if (!shape(input, ['schemaVersion', 'policy', 'articles']) || input.schemaVersion !== 1 ||
      !validPolicy(input.policy) || !Array.isArray(input.articles) || input.articles.length > 200 ||
      !input.articles.every(validArticle) || new Set(input.articles.map(article => article.id)).size !== input.articles.length) {
    return invalid();
  }
  const articles = [...input.articles].sort((a, b) => asciiOrder(a.id, b.id)).map(article =>
    ({ ...article, time: timestamp(article.publishedAt), features: features(article.title) }));
  const pairs = [];
  let comparedPairs = 0;
  for (let i = 0; i < articles.length; i++) for (let j = i + 1; j < articles.length; j++) {
    const left = articles[i], right = articles[j];
    const gap = Math.abs(left.time - right.time) / 3600000;
    if (gap > input.policy.maxGapHours) continue;
    comparedPairs++;
    let overlap = 0;
    for (const gram of left.features.grams) if (right.features.grams.has(gram)) overlap++;
    const score = 2 * overlap / (left.features.grams.size + right.features.grams.size);
    if (score < input.policy.minimumSimilarity) continue;
    const flags = [];
    if (left.features.numbers !== right.features.numbers) flags.push('numeric_strings_differ');
    if (left.language !== right.language) flags.push('cross_language');
    if (left.features.normalized === right.features.normalized) flags.push('identical_normalized_title');
    pairs.push({ left: left.id, right: right.id, score, publicationGapHours: rounded(gap), reviewRequired: true, flags });
  }
  pairs.sort((a, b) => b.score - a.score || asciiOrder(a.left, b.left) || asciiOrder(a.right, b.right));
  return { valid: true, errors: [], report: { schemaVersion: 1, algorithm: ALGORITHM, policy: { ...input.policy },
    articleCount: articles.length, totalPairs: articles.length < 2 ? 0 : articles.length * (articles.length - 1) / 2,
    comparedPairs, eligiblePairs: pairs.length, truncated: pairs.length > input.policy.maxPairs,
    pairs: pairs.slice(0, input.policy.maxPairs).map(({ score, ...pair }) => ({ ...pair, similarity: rounded(score) })) } };
}
function emptyCounts() { return { tp: 0, fp: 0, tn: 0, fn: 0, uncertain: 0, uncertainShortlisted: 0 }; }
function metrics(counts) {
  return { ...counts, precision: counts.tp + counts.fp ? counts.tp / (counts.tp + counts.fp) : null,
    recall: counts.tp + counts.fn ? counts.tp / (counts.tp + counts.fn) : null };
}
function addResult(counts, label, shortlisted) {
  if (label === 'uncertain') { counts.uncertain++; if (shortlisted) counts.uncertainShortlisted++; }
  else counts[label === 'same_event' ? shortlisted ? 'tp' : 'fn' : shortlisted ? 'fp' : 'tn']++;
}
function evaluatePairs(input) {
  if (!shape(input, ['schemaVersion', 'policy', 'provenance', 'cases']) || input.schemaVersion !== 1 ||
      !validPolicy(input.policy) || !['synthetic_original', 'local_labeled'].includes(input.provenance) ||
      !Array.isArray(input.cases) || input.cases.length < 1 || input.cases.length > 500) return invalid();
  const seen = new Set(), counts = emptyCounts(), categories = new Map(), decisions = [];
  for (const entry of input.cases) {
    if (!shape(entry, ['id', 'category', 'rationale', 'left', 'right', 'label']) ||
        typeof entry.id !== 'string' || !ID.test(entry.id) || seen.has(entry.id) ||
        typeof entry.category !== 'string' || !ID.test(entry.category) ||
        typeof entry.rationale !== 'string' || !entry.rationale.trim() || entry.rationale.length > 1000 ||
        !['same_event', 'different_event', 'uncertain'].includes(entry.label)) return invalid();
    seen.add(entry.id);
    const result = shortlistEvents({ schemaVersion: 1, policy: input.policy, articles: [entry.left, entry.right] });
    if (!result.valid) return invalid();
    const shortlisted = result.report.pairs.length === 1;
    addResult(counts, entry.label, shortlisted);
    if (!categories.has(entry.category)) categories.set(entry.category, emptyCounts());
    addResult(categories.get(entry.category), entry.label, shortlisted);
    decisions.push({ id: entry.id, category: entry.category, label: entry.label, shortlisted,
      similarity: result.report.pairs[0]?.similarity ?? null, flags: result.report.pairs[0]?.flags ?? [] });
  }
  return { valid: true, errors: [], report: { schemaVersion: 1, algorithm: ALGORITHM, provenance: input.provenance,
    policy: { ...input.policy }, caseCount: decisions.length, metrics: metrics(counts),
    byCategory: [...categories].sort(([a], [b]) => asciiOrder(a, b)).map(([category, values]) =>
      ({ category, metrics: metrics(values) })), cases: decisions } };
}
function runFile(mode, source, destination) {
  const loaded = readJsonFile(source);
  if (!Object.hasOwn(loaded, 'value')) return loaded;
  const result = mode === 'shortlist' ? shortlistEvents(loaded.value) : mode === 'evaluate' ? evaluatePairs(loaded.value) : invalid();
  if (!result.valid) return result;
  try {
    fs.writeFileSync(destination, `${JSON.stringify(result.report, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
  } catch { return { valid: false, errors: [{ code: 'output_file_unavailable' }] }; }
  if (mode === 'evaluate') return { valid: true, errors: [], caseCount: result.report.caseCount, metrics: result.report.metrics };
  return { valid: !result.report.truncated, errors: result.report.truncated ? [{ code: 'pair_budget_exceeded' }] : [],
    articleCount: result.report.articleCount, eligiblePairs: result.report.eligiblePairs,
    emittedPairs: result.report.pairs.length, truncated: result.report.truncated };
}
if (require.main === module) {
  const usage = process.argv.length !== 5 || !['shortlist', 'evaluate'].includes(process.argv[2]);
  const result = usage ? { valid: false, errors: [{ code: 'usage_mode_input_new_report_required' }] }
    : runFile(process.argv[2], process.argv[3], process.argv[4]);
  console.log(JSON.stringify(result));
  process.exitCode = usage ? 2 : result.valid ? 0 : 1;
}
module.exports = { shortlistEvents, evaluatePairs, runFile };
