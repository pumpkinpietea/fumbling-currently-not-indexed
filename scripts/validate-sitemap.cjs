const assert=require('node:assert/strict');
const {SaxesParser}=require('saxes');
const NS='http://www.sitemaps.org/schemas/sitemap/0.9',XHTML='http://www.w3.org/1999/xhtml';
function validateSitemap(text,{url,kind,origin='https://blog.pumpkinpie-tea.com'}={}){
  assert.ok(typeof text==='string'&&Buffer.byteLength(text)<=50*1024*1024,'Invalid sitemap size');
  const stack=[];let root;
  const parser=new SaxesParser({xmlns:true});
  parser.on('doctype',()=>{throw Error('Sitemap DOCTYPE is not allowed');});
  parser.on('opentag',tag=>{const node={name:tag.local,uri:tag.uri,attrs:tag.attributes,text:'',children:[]};if(stack.length)stack.at(-1).children.push(node);else root=node;stack.push(node);});
  parser.on('text',value=>{if(stack.length)stack.at(-1).text+=value;});
  parser.on('cdata',value=>{if(stack.length)stack.at(-1).text+=value;});
  parser.on('closetag',()=>stack.pop());
  parser.write(text).close();
  assert.ok(['urlset','sitemapindex'].includes(kind),'Invalid sitemap kind');
  assert.ok(root?.name===kind&&root.uri===NS&&!root.text.trim(),'Invalid sitemap root or namespace');
  assert.ok(root.children.length<=50000,'Too many sitemap entries');
  const directory=new URL('.',url).pathname;
  const absolute=value=>{assert.ok(value.length>0&&value.length<2048&&value===value.trim(),'Invalid sitemap URL length');const u=new URL(value);assert.ok(u.origin===origin&&!u.hash&&!u.username&&!u.password,'Invalid sitemap URL origin');return u;};
  const locations=[],alternates=[];
  for(const entry of root.children){
    assert.ok(entry.uri===NS&&entry.name===(kind==='urlset'?'url':'sitemap')&&!entry.text.trim(),'Invalid sitemap entry');
    const core=entry.children.filter(n=>n.uri===NS),names=core.map(n=>n.name);
    const allowed=kind==='urlset'?['loc','lastmod','changefreq','priority']:['loc','lastmod'];
    assert.ok(names[0]==='loc'&&new Set(names).size===names.length&&names.every((n,i)=>allowed.includes(n)&&(i===0||allowed.indexOf(names[i-1])<allowed.indexOf(n))),'Invalid sitemap fields');
    assert.ok(core.every(n=>n.children.length===0),'Nested sitemap scalar field');
    const loc=core[0].text,u=absolute(loc);
    assert.ok(u.pathname.startsWith(directory),'Sitemap URL is outside its directory scope');
    locations.push(loc);
    for(const node of core.slice(1)){
      const value=node.text;
      if(node.name==='lastmod'){
        assert.match(value,/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/,'Invalid sitemap date');
        assert.ok(Number.isFinite(Date.parse(value))&&new Date(value.slice(0,10)+'T00:00:00Z').toISOString().slice(0,10)===value.slice(0,10),'Invalid sitemap calendar date');
      }
      if(node.name==='changefreq')assert.ok(['always','hourly','daily','weekly','monthly','yearly','never'].includes(value),'Invalid change frequency');
      if(node.name==='priority')assert.ok(/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(value)&&Number(value)>=0&&Number(value)<=1,'Invalid sitemap priority');
    }
    const links=[];
    for(const node of entry.children.filter(n=>n.uri!==NS)){
      const attr=name=>node.attrs[name]?.value;
      assert.ok(kind==='urlset'&&node.uri===XHTML&&node.name==='link'&&!node.children.length&&!node.text.trim()&&attr('rel')==='alternate'&&['en-US','ja-JP'].includes(attr('hreflang')),'Invalid sitemap extension');
      absolute(attr('href')||'');links.push({language:attr('hreflang'),href:attr('href')});
    }
    assert.equal(new Set(links.map(l=>l.language)).size,links.length,'Duplicate alternate language');
    if(links.length)assert.ok(links.some(l=>l.href===loc),'Missing self alternate');
    alternates.push({loc,links});
  }
  assert.equal(new Set(locations).size,locations.length,'Duplicate sitemap URL');
  return {locations,alternates};
}
module.exports={validateSitemap};
