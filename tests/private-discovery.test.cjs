const test=require('node:test'),assert=require('node:assert/strict');
const {safeLink,htmlLinks,sitemapLinks,schedule,discoverPrivate,newsletterCandidates,render}=require('../scripts/private-discovery.cjs');
const {dailyQueries}=require('../scripts/google-news-reader.cjs');
const {relevantNews}=require('../scripts/news-relevance.cjs');
test('Six language searches rotate by Jakarta day and retain original fixed searches',()=>{
  const ids=new Set();for(let day=10;day<16;day++){const queries=dailyQueries(new Date(`2026-10-${day}T00:30:00Z`));assert.equal(queries.length,3);assert.equal(queries[0].id,'sea-tech');ids.add(queries[2].id);}assert.equal(ids.size,6);
  for(const text of ['Indonesia teknologi digital','ベトナムのEC市場','Việt Nam công nghệ','อาเซียน เทคโนโลยี','印尼 电商','إندونيسيا التكنولوجيا'])assert.equal(relevantNews(text),true,text);
  assert.equal(relevantNews('Football https://example.com/Indonesia/digital'),false);
  assert.equal(relevantNews('China 人工智能'),false);
  assert.equal(relevantNews('日本でリアルタイムAI翻訳を発表'),false);
});
test('Fixed schedule bounds four requests, weekly research and watchlist index',()=>{
  for(const day of ['11','12']){const requests=schedule(new Date(`2026-10-${day}T00:30:00Z`));assert.equal(requests.length,4);assert.equal(new Set(requests.map(s=>s.url)).size,4);assert.equal(requests[3].kind,'gdelt');assert.equal(new URL(requests[3].url).searchParams.get('maxrecords'),'50');assert.equal(requests.some(s=>s.weekly),day==='12');}
});
test('Newsletter intake extracts links without fetching and rejects credentials or private destinations',()=>{
  for(const value of ['http://example.com/a','https://127.0.0.1/a','https://localhost/a','https://user:pass@example.com/a','https://example.com/a?auth=secret','https://host.internal/a'])assert.equal(safeLink(value),null,value);
  const candidates=newsletterCandidates(Buffer.from('<a href="https://example.com/news?utm_source=mail">Indonesia digital &amp; AI</a>\nhttps://example.com/news'));
  assert.equal(candidates.length,1);assert.equal(candidates[0].url,'https://example.com/news');assert.equal(candidates[0].originalVerified,false);
  assert.throws(()=>newsletterCandidates(Buffer.from('Content-Transfer-Encoding: base64\n\naaaa')));
  assert.throws(()=>newsletterCandidates(Buffer.alloc(1048577)));
  assert.ok(!render({candidates:[{...candidates[0],title:'<script>evil</script>'}]}).includes('<script>'));
});
test('HTML and sitemap parsers retain only links, not timestamps as original publication',()=>{
  const links=htmlLinks('<a href="/news/a">ASEAN AI</a><a href="javascript:evil">bad</a>','https://example.com/');assert.equal(links.length,1);
  const sitemap=sitemapLinks('<urlset><url><loc>https://example.com/news/a</loc><lastmod>2026-10-10</lastmod></url></urlset>');assert.equal(sitemap[0].sitemapLastModified,'2026-10-10');assert.equal(sitemap[0].publishedAt,undefined);
});
test('Source failures are isolated, bounds passed to transport and GDELT dates stay unverified',async()=>{
  let calls=0;const reader=await discoverPrivate({now:()=>new Date('2026-10-11T00:30:00Z'),priorUrls:['https://example.com/a'],fetch:async(url,options)=>{
    calls++;assert.equal(options.timeoutMs,5000);assert.equal(options.maxBytes,1048576);
    if(new URL(url).hostname!=='api.gdeltproject.org')throw new Error('synthetic');
    return Buffer.from(JSON.stringify({articles:[{url:'https://example.com/a',title:'Indonesia digital services',seendate:'20261010T000000Z'}]}));
  }});
  assert.equal(calls,4);assert.equal(reader.report.sources.filter(s=>s.status==='failed').length,3);assert.equal(reader.report.candidates.length,1);assert.equal(reader.report.candidates[0].newSincePrevious,false);assert.equal(reader.report.candidates[0].originalVerified,false);assert.equal(reader.report.candidates[0].publishedAt,undefined);
});
