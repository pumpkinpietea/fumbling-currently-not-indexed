const { parseFragment } = require('parse5');
const crypto = require('node:crypto');
function text(node) {
  if (['script', 'style', 'iframe', 'img'].includes(node.tagName)) return '';
  if (node.nodeName === '#text') return node.value;
  return (node.childNodes || []).map(text).join(' ');
}
const { sourcePolicy, validCreator, sourceProvider } = require('./news-source-policy.cjs');
function titleEvidenceMinimum(policy, title, { legacy = false } = {}) {
  return !legacy && policy?.feed.language === 'ja' && /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(title) ? 20 : 40;
}
function extractRssEvidence(record) {
  const policy = sourcePolicy(record);
  if (!policy || typeof record.title !== 'string' || record.title.length > 500 ||
      !Number.isFinite(Date.parse(record.publishedAt))) throw new Error('source_metadata_rejected');
  const title = text(parseFragment(record.title)).replace(/\s+/g, ' ').trim();
  if (policy.source.requireProvider && !sourceProvider(title)) throw new Error('source_attribution_rejected');
  const titleOnly = policy.source.automatedUse === 'rss_title_notes';
  if (!titleOnly && (typeof record.description !== 'string' || record.description.length > 10000))
    throw new Error('source_metadata_rejected');
  const description = titleOnly ? '' : text(parseFragment(record.description)).replace(/\s+/g, ' ').trim();
  if (title.length < 8 || (titleOnly ? title.length < titleEvidenceMinimum(policy, title) : description.length < 40)) throw new Error('insufficient_rss_evidence');
  if (policy.source.requireCreator && !validCreator(record.creator)) throw new Error('source_attribution_rejected');
  const excerpt = (titleOnly ? title : `${title}\n${description}`).slice(0, 2200);
  return { id: crypto.createHash('sha256').update(record.url).digest('hex').slice(0, 16),
    publisher: policy.source.name, evidenceType: titleOnly ? 'official_rss_title' : 'official_rss_excerpt',
    ...(record.feedId ? { feedId: record.feedId } : {}),
    ...(policy.source.requireCreator ? { creator: record.creator } : {}),
    url: record.url, title, publishedAt: record.publishedAt, excerpt,
    excerptHash: crypto.createHash('sha256').update(excerpt).digest('hex') };
}
function sourceTextForRelevance(source) {
  // A distributor's provider credit is attribution, not a subject location or topic.
  if (!sourcePolicy(source)?.source.requireProvider) return source.excerpt;
  if (!source.excerpt.startsWith(source.title)) throw new Error('source_metadata_rejected');
  const title = source.title.replace(/(?:\([^()]+\)|（[^（）]+）)$/, '').trim();
  return title + source.excerpt.slice(source.title.length);
}
module.exports = { extractRssEvidence, titleEvidenceMinimum, sourceTextForRelevance };
