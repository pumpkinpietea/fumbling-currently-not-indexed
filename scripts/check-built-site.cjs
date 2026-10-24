const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { validateSitemap } = require('./validate-sitemap.cjs');
const { parse } = require('parse5');
const root = process.argv[2];
const translationEntries=[];
function xml(file,kind='urlset') {
  const {locations,alternates}=validateSitemap(fs.readFileSync(path.join(root,file),'utf8'),{url:`https://blog.pumpkinpie-tea.com/${file}`,kind});
  for(const value of [...locations,...alternates.flatMap(entry=>entry.links.map(link=>link.href))]){
    const url=new URL(value);
    assert.ok(fs.existsSync(path.join(root,decodeURI(url.pathname),url.pathname.endsWith('/')?'index.html':'')),`Missing sitemap target ${url.pathname}`);
  }
  if(kind==='urlset')translationEntries.push(...alternates);
  return locations;
}
assert.deepEqual(xml('sitemap.xml','sitemapindex').sort(),['https://blog.pumpkinpie-tea.com/jp/sitemap.xml','https://blog.pumpkinpie-tea.com/sitemap-en.xml']);
assert.equal(fs.readFileSync(path.join(root,'sitemap-en.xml'),'utf8'),fs.readFileSync(path.join(root,'en/sitemap.xml'),'utf8'));
const redirects=require('../firebase.json').hosting.redirects;
assert.deepEqual(redirects.find(r=>r.source==='/en/sitemap.xml'),{source:'/en/sitemap.xml',destination:'/sitemap-en.xml',type:301});
for (const [language, prefix] of [['en', ''], ['jp', '/jp']]) {
  const locations = xml(language==='en'?'sitemap-en.xml':'jp/sitemap.xml');
  for (const route of ['/news/', '/search/', '/article/southeast-asia-tech-2026-10-11/']) assert.ok(locations.includes(`https://blog.pumpkinpie-tea.com${prefix}${route}`));
  const html = fs.readFileSync(path.join(root, prefix, 'news/index.html'), 'utf8');
  const nodes = []; const visit = node => { nodes.push(node); (node.childNodes || []).forEach(visit); }; visit(parse(html));
  const attr = (node, name) => node.attrs?.find(a => a.name === name)?.value;
  assert.equal(attr(nodes.find(node => node.tagName === 'html'), 'lang'), language === 'jp' ? 'ja-JP' : 'en-US');
  const alternates = nodes.filter(node => node.tagName === 'link' && attr(node, 'hreflang'));
  assert.deepEqual(alternates.map(node => attr(node, 'hreflang')).sort(), ['en-US','ja-JP']);
  const schemas = nodes.filter(node => node.tagName === 'script' && attr(node, 'type') === 'application/ld+json').map(node => JSON.parse(node.childNodes[0].value));
  for (const schema of schemas.filter(value => value.inLanguage)) assert.equal(schema.inLanguage, language === 'jp' ? 'ja-JP' : 'en-US');
  assert.ok(nodes.filter(node => attr(node, 'data-news-card') !== undefined).length >= 7);
  assert.ok(nodes.some(node => attr(node, 'data-news-filters') !== undefined && attr(node, 'hidden') !== undefined));
  for (const node of nodes.filter(node => node.tagName === 'a' && attr(node, 'href')?.startsWith('https://') && (node.parentNode?.tagName === 'li' && node.parentNode?.parentNode?.attrs?.some(a => a.name === 'class' && a.value === 'news-sources')))) {
    assert.equal(attr(node, 'target'), '_blank'); assert.match(attr(node, 'rel'), /noopener/); assert.match(attr(node, 'rel'), /noreferrer/);
  }
  assert.match(html, /source-country/); assert.match(html, /WIB/);
}
for(const entry of translationEntries)for(const link of entry.links){
  const peer=translationEntries.find(e=>e.loc===link.href);
  assert.ok(peer&&peer.links.some(l=>l.href===entry.loc),'Missing reciprocal sitemap alternate');
}
assert.match(fs.readFileSync(path.join(root, 'robots.txt'), 'utf8'), /Sitemap: https:\/\/blog.pumpkinpie-tea.com\/sitemap.xml/);
console.log('Built bilingual news UI and sitemap checks passed.');
