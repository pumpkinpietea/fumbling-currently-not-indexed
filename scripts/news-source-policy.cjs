const registry = require('../config/news-sources.json');
const active = registry.sources.filter(s => ['rss_excerpt_notes', 'rss_title_notes'].includes(s.automatedUse));
const dailyFeeds = Object.freeze(active.flatMap(s => s.feeds.filter(f => f.daily).map(f => f.id)));
function sourcePolicy(record) {
  let url;
  try { url = new URL(record.url); } catch { return null; }
  if (url.protocol !== 'https:' || url.username || url.password || url.port || url.search || url.hash) return null;
  for (const source of active) {
    // Preserve the already reviewed ANTARA bundle contract; other publishers require feed provenance.
    const feed = record.feedId ? source.feeds.find(f => f.id === record.feedId) :
      source.id === 'antara' ? source.feeds[0] : null;
    if (feed && feed.allowedHosts.includes(url.hostname) && new RegExp(source.articlePath).test(url.pathname))
      return { source, feed };
  }
  return null;
}
const validCreator = value => typeof value === 'string' && value.length >= 2 && value.length <= 160 &&
  !/[<>\[\]{}\r\n`\\]|https?:|www\.|@/i.test(value);
module.exports = { dailyFeeds, sourcePolicy, validCreator };
