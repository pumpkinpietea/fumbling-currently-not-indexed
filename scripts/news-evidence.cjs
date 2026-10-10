const { parseFragment } = require('parse5');
const crypto = require('node:crypto');
function text(node) {
  if (['script', 'style', 'iframe', 'img'].includes(node.tagName)) return '';
  if (node.nodeName === '#text') return node.value;
  return (node.childNodes || []).map(text).join(' ');
}
function extractRssEvidence(record) {
  const url = new URL(record.url);
  if (url.protocol !== 'https:' || url.hostname !== 'www.antaranews.com' || url.username || url.password || url.port ||
      !/^\/berita\/\d+\/[a-z0-9-]+$/.test(url.pathname) || url.search || url.hash ||
      typeof record.title !== 'string' || typeof record.description !== 'string' ||
      record.description.length > 10000 || !Number.isFinite(Date.parse(record.publishedAt))) throw new Error('source_metadata_rejected');
  const description = text(parseFragment(record.description)).replace(/\s+/g, ' ').trim();
  if (description.length < 40) throw new Error('insufficient_rss_evidence');
  const excerpt = `${record.title}\n${description}`.slice(0, 2200);
  return { id: crypto.createHash('sha256').update(record.url).digest('hex').slice(0, 16),
    publisher: 'ANTARA', evidenceType: 'official_rss_excerpt', url: record.url, title: record.title,
    publishedAt: record.publishedAt, excerpt, excerptHash: crypto.createHash('sha256').update(excerpt).digest('hex') };
}
module.exports = { extractRssEvidence };
