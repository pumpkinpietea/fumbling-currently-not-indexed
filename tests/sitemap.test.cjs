const {test}=require('node:test'),assert=require('node:assert/strict');
const {validateSitemap}=require('../scripts/validate-sitemap.cjs');
const origin='https://blog.pumpkinpie-tea.com',ns='http://www.sitemaps.org/schemas/sitemap/0.9';
const entry='<url><loc>'+origin+'/article/example/</loc><lastmod>2026-10-24T00:32:02+00:00</lastmod></url>';
const doc=body=>`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="${ns}" xmlns:xhtml="http://www.w3.org/1999/xhtml">${body}</urlset>`;
const options={url:origin+'/sitemap-en.xml',kind:'urlset'};
test('root English sitemap accepts multilingual extensions and escaped URL values',()=>{
 const text=doc(entry.replace('</url>',`<xhtml:link rel="alternate" hreflang="en-US" href="${origin}/article/example/"/><xhtml:link rel="alternate" hreflang="ja-JP" href="${origin}/jp/article/example/"/></url>`));
 const value=validateSitemap(text,options);assert.equal(value.locations.length,1);assert.equal(value.alternates[0].links.length,2);
 assert.equal(validateSitemap(doc(`<url><loc>${origin}/article/example/?a=1&amp;b=2</loc></url>`),options).locations[0],origin+'/article/example/?a=1&b=2');
});
test('XML validation rejects malformed roots, wrong namespaces, absent/duplicate fields and duplicate URLs',()=>{
 for(const text of [doc(entry).replace('urlset','broken'),doc(entry).replace(ns,'https://example.invalid/ns'),doc('<url><lastmod>2026-10-24</lastmod></url>'),doc(entry.replace('</loc>','</loc><loc>'+origin+'/</loc>')),doc(entry+entry),doc(entry.replace('</url>','<invented>value</invented></url>')),doc(entry.replace('</loc>','<extra/></loc>'))])assert.throws(()=>validateSitemap(text,options));
});
test('directory scope rejects legacy /en/ placement while accepting root English and /jp/ Japanese URLs',()=>{
 assert.throws(()=>validateSitemap(doc(entry),{...options,url:origin+'/en/sitemap.xml'}),/directory scope/);
 assert.equal(validateSitemap(doc(entry),options).locations.length,1);
 assert.equal(validateSitemap(doc(entry.replace('/article/','/jp/article/')),{...options,url:origin+'/jp/sitemap.xml'}).locations.length,1);
 assert.throws(()=>validateSitemap(doc(entry),{...options,url:origin+'/jp/sitemap.xml'}),/directory scope/);
});
test('validation rejects unsafe origins, invalid dates and unsupported or incomplete alternate links',()=>{
 for(const text of [doc(entry.replace(origin,'https://example.com')),doc(entry.replace(origin,'http://blog.pumpkinpie-tea.com')),doc(entry.replace('2026-10-24T00:32:02+00:00','2026-02-30')),doc(entry.replace('</url>','<priority>2</priority></url>')),doc(entry.replace('</url>','<changefreq>sometimes</changefreq></url>')),doc(entry.replace('</url>',`<xhtml:link rel="alternate" hreflang="ja-JP" href="${origin}/jp/article/example/"/></url>`)),doc(entry.replace('</url>',`<xhtml:link rel="alternate" hreflang="jp" href="${origin}/article/example/"/></url>`)),doc(entry).replace('http://www.w3.org/1999/xhtml','https://example.invalid/xhtml').replace('</url>',`<xhtml:link rel="alternate" hreflang="en-US" href="${origin}/article/example/"/></url>`),'<!DOCTYPE urlset>'+doc(entry)])assert.throws(()=>validateSitemap(text,options));
});
test('index accepts only sitemap entries with namespaced absolute loc children',()=>{
 const text=`<sitemapindex xmlns="${ns}"><sitemap><loc>${origin}/sitemap-en.xml</loc><lastmod>2026-10-24</lastmod></sitemap></sitemapindex>`;
 assert.deepEqual(validateSitemap(text,{url:origin+'/sitemap.xml',kind:'sitemapindex'}).locations,[origin+'/sitemap-en.xml']);
 assert.throws(()=>validateSitemap(text,{url:origin+'/sitemap.xml',kind:'urlset'}));
 assert.throws(()=>validateSitemap(text.replace('<sitemap>','<url>').replace('</sitemap>','</url>'),{url:origin+'/sitemap.xml',kind:'sitemapindex'}));
});
