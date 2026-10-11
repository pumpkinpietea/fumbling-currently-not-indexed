const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {chromium}=require('@playwright/test');
async function review(){
  const args=process.argv.slice(2);
  const preview=args.length===2 && args[0]==='--preview-bundle';
  if(args.length && !(args.length===1 && args[0]==='--live') && !preview)throw new Error('usage_live_or_preview_bundle');
  const output=fs.mkdtempSync(path.join(os.tmpdir(),'news-ui-review-'));fs.chmodSync(output,0o700);
  const site=path.join(output,'site');fs.mkdirSync(site);const screenshots=path.join(output,'screenshots');fs.mkdirSync(screenshots);
  const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.xml':'application/xml'};
  const server=http.createServer((request,response)=>{
    try{const pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname);let file=path.resolve(site,'.'+pathname);
      if(!file.startsWith(site+path.sep)&&file!==site)throw new Error();
      if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
      response.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});response.end(fs.readFileSync(file));
    }catch{response.writeHead(404);response.end('Not found');}
  });
  const live=args[0]==='--live';
  let previewDate;
  if(preview){
    const bundle=JSON.parse(fs.readFileSync(args[1],'utf8'));
    const files=require('./daily-news.cjs').validateBundle(bundle,bundle.editionDate);previewDate=bundle.editionDate;
    fs.cpSync('content',path.join(output,'content'),{recursive:true});
    fs.writeFileSync(path.join(output,'preview.json'),JSON.stringify({languages:{en:{contentDir:path.join(output,'content/en')},jp:{contentDir:path.join(output,'content/jp')}}}));
    for(const [name,content] of Object.entries(files)){const file=path.join(output,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,content);}
  }
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=live?'https://blog.pumpkinpie-tea.com':`http://127.0.0.1:${server.address().port}`;
  let browser;
  const report={revision:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),workingTreeModified:!!execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),browser:null,scope:live?'production':'local-working-tree',output,checks:[],screenshots:[],visualInspection:'pending: open screenshots; automated assertions are not visual approval'};
  try{
    if(!live)execFileSync('hugo',[...(preview?['--config',`hugo.yaml,${path.join(output,'preview.json')}`,'--buildFuture']:[]),'--minify','--baseURL',base+'/','--destination',site,'--cacheDir',path.join(output,'cache')],{stdio:'pipe'});
    browser=await chromium.launch();report.browser=browser.version();
    const sizes=[['desktop',1280,900],['tablet',768,1024],['mobile',375,812]];
    for(const language of ['en','jp'])for(const theme of ['light','dark'])for(const [size,width,height] of sizes){
      const context=await browser.newContext({viewport:{width,height},colorScheme:theme,locale:language==='jp'?'ja-JP':'en-US'});
      context.setDefaultTimeout(30000);
      await context.addInitScript(value=>localStorage.setItem('pref-theme',value),theme);
      await context.route('**/*',route=>route.request().url().startsWith(base+'/')?route.continue():route.abort());
      const page=await context.newPage(),errors=[],broken=[];
      page.on('pageerror',error=>errors.push(error.message));
      page.on('response',response=>{if(response.url().startsWith(base+'/')&&response.status()>=400)broken.push({status:response.status(),pathname:new URL(response.url()).pathname});});
      const prefix=language==='jp'?'/jp':'';
      const routes=[['home',prefix+'/'],['news',prefix+'/news/'],['article',prefix+`/article/southeast-asia-tech-${previewDate || '2026-10-11'}/`],...(preview?[['indonesia',prefix+`/article/indonesia-news-${previewDate}/`]]:[]),['search',prefix+'/search/']];
      for(const [name,route] of routes){
        const response=await page.goto(base+route,{waitUntil:'networkidle'});assert.equal(response.status(),200);
        await page.evaluate(()=>document.fonts.ready);
        await page.evaluate(()=>scrollTo(0,0));
        const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
        const missingImages=await page.locator('img').evaluateAll(images=>images.filter(image=>!image.complete||!image.naturalWidth).map(image=>image.getAttribute('src')));
        const file=`${language}-${theme}-${size}-${name}.png`;
        await page.screenshot({path:path.join(screenshots,file),animations:'disabled'});report.screenshots.push(file);
        assert.equal(overflow,false,`${language}/${theme}/${size}/${name}: horizontal overflow`);
        assert.deepEqual(missingImages,[],`${language}/${theme}/${size}/${name}: broken image`);
        assert.deepEqual(errors,[],`${language}/${theme}/${size}/${name}: browser error`);
        assert.deepEqual(broken,[],`${language}/${theme}/${size}/${name}: missing resource`);
        report.checks.push({language,theme,size,route,status:'passed'});
        if(name==='news'){
          assert.equal(await page.locator('[data-news-filters]').isVisible(),true);
          await page.locator('[name=query]').focus();await page.keyboard.press('Tab');
          assert.equal(await page.evaluate(()=>document.activeElement.name),'country');
          const initialTheme=await page.locator('html').getAttribute('data-theme');await page.locator('#theme-toggle').click();assert.notEqual(await page.locator('html').getAttribute('data-theme'),initialTheme);await page.locator('#theme-toggle').click();
          if(size==='mobile')await page.locator('.news-card').first().screenshot({path:path.join(screenshots,`${language}-${theme}-source-card.png`)});
          await page.locator('[name=country]').selectOption('VN');await page.locator('[name=topic]').selectOption('ecommerce');
          await page.locator('[name=query]').fill(language==='jp'?'越境':'cross-border');
          assert.equal(await page.locator('[data-news-card]:visible').count(),1);
          await page.screenshot({path:path.join(screenshots,`${language}-${theme}-${size}-filtered.png`),animations:'disabled'});
          await page.locator('[name=query]').fill('zzzz-no-results');assert.equal(await page.locator('[data-news-card]:visible').count(),0);
          assert.match(await page.locator('[data-news-status]').textContent(),/^0/);
          if(size==='mobile')await page.screenshot({path:path.join(screenshots,`${language}-${theme}-empty.png`),animations:'disabled'});
          await page.locator('[name=query]').fill('');await page.locator('[name=country]').selectOption('');await page.locator('[name=topic]').selectOption('');assert.ok(await page.locator('[data-news-card]:visible').count()>=7);
          const heading=page.locator('.news-card h2 a[href*="#"]').first();await heading.click();await page.waitForURL(/#./);
          const anchor=decodeURIComponent(new URL(page.url()).hash.slice(1));assert.equal(await page.locator(`[id="${anchor}"]`).count(),1);
        }
        if(name==='article'||name==='indonesia'){
          if(preview){
            const highlights=page.locator('.post-content a[href^="#news-"]');
            if(await highlights.count()){await highlights.first().click();await page.waitForURL(/#news-/);const id=new URL(page.url()).hash.slice(1);assert.equal(await page.locator(`h2[id="${id}"]`).count(),1);}
            else assert.match(await page.locator('.post-content').textContent(),/No new eligible|本日の収集範囲/);
          }
          const sources=page.locator('a.source-link');if(!preview)assert.equal(await sources.count(),5);
          if(!await sources.count()){assert.ok(preview);continue;}
          for(const link of await sources.all()){assert.equal(await link.getAttribute('target'),'_blank');assert.match(await link.getAttribute('rel'),/noopener.*noreferrer/);}
          if(size==='mobile'){await sources.first().scrollIntoViewIfNeeded();await page.screenshot({path:path.join(screenshots,`${language}-${theme}-${name}-source.png`),animations:'disabled'});}
          const source=await sources.first().getAttribute('href');const [popup,request]=await Promise.all([context.waitForEvent('page'),context.waitForEvent('request',{predicate:request=>request.url()===source && request.isNavigationRequest()}),sources.first().click()]);
          assert.equal(request.url(),source);await popup.close();
        }
      }
      await context.close();
    }
    const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:375,height:812}});
    await context.route('**/*',route=>route.request().url().startsWith(base+'/')?route.continue():route.abort());
    for(const prefix of ['','/jp']){const page=await context.newPage();await page.goto(base+prefix+'/news/');assert.ok(await page.locator('[data-news-card]:visible').count()>=7);assert.equal(await page.locator('[data-news-filters]').isVisible(),false);await page.screenshot({path:path.join(screenshots,`${prefix? 'jp':'en'}-no-js.png`)});await page.close();}await context.close();
    report.status='passed';return report;
  }catch(error){report.status='failed';report.error=error.message;throw error;}
  finally{fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2),{mode:0o600});await browser?.close();await new Promise(resolve=>server.close(resolve));console.log(JSON.stringify({status:report.status,output,checks:report.checks.length,error:report.error}));}
}
review().catch(()=>{process.exitCode=1;});
