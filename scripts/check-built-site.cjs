const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { SaxesParser } = require('saxes');
const { parse } = require('parse5');
const root = process.argv[2];
function xml(file) {
  const locations = [], alternates = []; let location = false;
  const parser = new SaxesParser({ xmlns: true });
  parser.on('opentag', node => { location = node.local === 'loc'; if (node.local === 'link') alternates.push(node.attributes.hreflang?.value); });
  parser.on('text', text => { if (location) locations.push(text); });
  parser.on('closetag', () => { location = false; });
  parser.write(fs.readFileSync(path.join(root, file), 'utf8')).close();
  assert.equal(new Set(locations).size, locations.length, 'Duplicate sitemap URL');
  for (const value of locations) {
    const url = new URL(value); assert.equal(url.origin, 'https://blog.pumpkinpie-tea.com');
    assert.ok(fs.existsSync(path.join(root, decodeURI(url.pathname), url.pathname.endsWith('/') ? 'index.html' : '')), `Missing sitemap target ${url.pathname}`);
  }
  assert.ok(alternates.every(lang => ['en-US', 'ja-JP'].includes(lang)));
  return locations;
}
assert.equal(xml('sitemap.xml').length, 2);
for (const [language, prefix] of [['en', ''], ['jp', '/jp']]) {
  const locations = xml(`${language}/sitemap.xml`);
  for (const route of ['/news/', '/search/', '/article/southeast-asia-tech-2026-10-11/']) assert.ok(locations.includes(`https://blog.pumpkinpie-tea.com${prefix}${route}`));
  const html = fs.readFileSync(path.join(root, prefix, 'news/index.html'), 'utf8');
  const nodes = []; const visit = node => { nodes.push(node); (node.childNodes || []).forEach(visit); }; visit(parse(html));
  const attr = (node, name) => node.attrs?.find(a => a.name === name)?.value;
  assert.ok(nodes.filter(node => attr(node, 'data-news-card') !== undefined).length >= 7);
  assert.ok(nodes.some(node => attr(node, 'data-news-filters') !== undefined && attr(node, 'hidden') !== undefined));
  for (const node of nodes.filter(node => node.tagName === 'a' && attr(node, 'href')?.startsWith('https://') && (node.parentNode?.tagName === 'li' && node.parentNode?.parentNode?.attrs?.some(a => a.name === 'class' && a.value === 'news-sources')))) {
    assert.equal(attr(node, 'target'), '_blank'); assert.match(attr(node, 'rel'), /noopener/); assert.match(attr(node, 'rel'), /noreferrer/);
  }
  assert.match(html, /source-country/); assert.match(html, /WIB/);
}
assert.match(fs.readFileSync(path.join(root, 'robots.txt'), 'utf8'), /Sitemap: https:\/\/blog.pumpkinpie-tea.com\/sitemap.xml/);
console.log('Built bilingual news UI and sitemap checks passed.');
