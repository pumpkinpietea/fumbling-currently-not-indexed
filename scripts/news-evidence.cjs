const { parseFragment } = require('parse5');
const crypto = require('node:crypto');
function text(node) {
  if (['script', 'style', 'iframe', 'img'].includes(node.tagName)) return '';
  if (node.nodeName === '#text') return node.value;
  return (node.childNodes || []).map(text).join(' ');
}
const { sourcePolicy, validCreator } = require('./news-source-policy.cjs');
function extractRssEvidence(record) {
  const policy = sourcePolicy(record);
  if (!policy || typeof record.title !== 'string' || record.title.length > 500 ||
      !Number.isFinite(Date.parse(record.publishedAt))) throw new Error('source_metadata_rejected');
  const title = text(parseFragment(record.title)).replace(/\s+/g, ' ').trim();
  const titleOnly = policy.source.automatedUse === 'rss_title_notes';
  if (!titleOnly && (typeof record.description !== 'string' || record.description.length > 10000))
    throw new Error('source_metadata_rejected');
  const description = titleOnly ? '' : text(parseFragment(record.description)).replace(/\s+/g, ' ').trim();
  if (title.length < 8 || (titleOnly ? title.length < 40 : description.length < 40)) throw new Error('insufficient_rss_evidence');
  if (policy.source.requireCreator && !validCreator(record.creator)) throw new Error('source_attribution_rejected');
  const excerpt = (titleOnly ? title : `${title}\n${description}`).slice(0, 2200);
  return { id: crypto.createHash('sha256').update(record.url).digest('hex').slice(0, 16),
    publisher: policy.source.name, evidenceType: titleOnly ? 'official_rss_title' : 'official_rss_excerpt',
    ...(record.feedId ? { feedId: record.feedId } : {}),
    ...(policy.source.requireCreator ? { creator: record.creator } : {}),
    url: record.url, title, publishedAt: record.publishedAt, excerpt,
    excerptHash: crypto.createHash('sha256').update(excerpt).digest('hex') };
}
module.exports = { extractRssEvidence };
