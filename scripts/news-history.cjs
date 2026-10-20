function validateEditorialHistory(value, date, instant) {
  if (!value || Object.keys(value).sort().join(',') !== 'editionDate,eventHints,publishedAt,schemaVersion,sourceUrls,status' ||
      value.schemaVersion !== 1 || value.status !== 'published' || value.editionDate !== date ||
      typeof value.publishedAt !== 'string' || !Number.isFinite(Date.parse(value.publishedAt)) ||
      Date.parse(value.publishedAt) > instant.getTime() ||
      new Date(Date.parse(value.publishedAt)+25200000).toISOString().slice(0,10) < date ||
      !Array.isArray(value.sourceUrls) || !value.sourceUrls.length || value.sourceUrls.length > 40 ||
      new Set(value.sourceUrls).size !== value.sourceUrls.length ||
      value.sourceUrls.some(url=>{
        try { const parsed=new URL(url);return parsed.protocol!=='https:' || parsed.username || parsed.password || parsed.port || parsed.search || parsed.hash || url.length>4096; }
        catch { return true; }
      }) || !Array.isArray(value.eventHints) || value.eventHints.length > 40 ||
      value.eventHints.some(text=>typeof text!=='string' || text.length<8 || text.length>100 || /[\r\n<>]/.test(text)))
    throw new Error('invalid_editorial_history');
  return value;
}
module.exports = { validateEditorialHistory };
