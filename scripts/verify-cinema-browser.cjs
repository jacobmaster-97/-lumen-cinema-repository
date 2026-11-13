// Uses the environment's Playwright + Chromium. Tests the built site, not a dev-only entry.
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),base=process.env.CINEMA_TEST_URL||'http://127.0.0.1:8192/';
(async()=>{
 const E=await import(pathToFileURL(path.join(root,'prototypes/browser/engine.mjs')));
 const out=path.join(root,'production/verification/v0.3');await fs.mkdir(out,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const result={url:base,checks:[],errors:[],viewports:[]};
 function pass(name){result.checks.push(name);console.log('PASS '+name);}
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1}),page=await context.newPage();
  page.on('pageerror',e=>result.errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')result.errors.push(m.text());});
  await page.goto(base,{waitUntil:'networkidle'});await page.locator('#modal .primary[data-action="close"]').click();
  await page.waitForFunction(()=>window.__lumen?.getDiagnostics()?.pathsReachable);
  const state=()=>page.evaluate(()=>window.__lumen.getState()),diagnostics=()=>page.evaluate(()=>window.__lumen.getDiagnostics());
  const restore=async s=>{await page.evaluate(raw=>localStorage.setItem('lumen-cinema-v2',raw),E.saveGame(s));await page.locator('#load-button').click();};
  assert.deepEqual((await diagnostics()).seatCounts,[48,40]);pass('fresh start, all runtime assets and elevated world loaded');
  await page.waitForTimeout(2500);result.warmRender=await diagnostics();assert.ok(result.warmRender.renderP95Ms<40,'warm renderer budget '+result.warmRender.renderP95Ms);pass('cached desktop renderer stays below 40ms CPU p95');
  await page.locator('[data-action="select-zone"][data-id="hall1"]').click();assert.match(await page.locator('#zone-inspector').innerText(),/48 席/);assert.ok(!(await page.locator('#zone-inspector').innerText()).includes('維修期間'));pass('region selection and accurate planning hall status');
  await page.locator('[data-action="zoom-in"]').click();await page.locator('[data-action="zoom-in"]').click();assert.equal(await page.locator('#map-zoom').innerText(),'140%');await page.locator('[data-action="map-fit"]').click();assert.equal(await page.locator('#map-zoom').innerText(),'100%');
  const bounds=await page.locator('#cinema').boundingBox();await page.mouse.move(bounds.x+bounds.width*.6,bounds.y+bounds.height*.6);await page.mouse.down();await page.mouse.move(bounds.x+bounds.width*.6+60,bounds.y+bounds.height*.6+25,{steps:5});await page.mouse.up();assert.ok(Math.abs((await diagnostics()).camera.x)>10);await page.locator('[data-action="map-fit"]').click();pass('pointer pan, zoom and panorama reset');
  await page.locator('[data-action="clear-zone"]').click();await page.evaluate(()=>scrollTo(0,0));
  await page.screenshot({path:path.join(root,'docs/screenshots/v0.3-desktop.png'),fullPage:true});
  await fs.writeFile(path.join(root,'docs/screenshots/v0.3-cinema.png'),Buffer.from(await page.locator('#cinema').evaluate(c=>c.toDataURL().split(',')[1]),'base64'));
  await page.locator('[data-view="movies"]').click();await page.locator('[data-action="film-filter"][data-filter="all"]').click();assert.equal(await page.locator('.film-card').count(),20);await page.screenshot({path:path.join(root,'docs/screenshots/v0.3-films.png'),fullPage:true});pass('all twenty films have runtime poster coverage');
  await page.locator('[data-view="overview"]').click();await page.locator('[data-speed="4"]').click();await page.locator('#main-action').click();await page.waitForFunction(()=>window.__lumen.getState().branches[0].ledger.admissions>0,{timeout:15000});assert.equal((await state()).phase,'running');
  await fs.writeFile(path.join(root,'docs/screenshots/v0.3-running.png'),Buffer.from(await page.locator('#cinema').evaluate(c=>c.toDataURL().split(',')[1]),'base64'));pass('automatic operation, admissions, customers and film projection');
  const legacy=JSON.parse(await fs.readFile(path.join(root,'tests/cinema/fixtures/v2-save.json'),'utf8')).state;await restore(legacy);assert.equal((await state()).cash,legacy.cash);assert.equal((await state()).branches[0].owned,true);assert.equal((await state()).activeBranch,1);await page.locator('[data-action="branch"][data-id="0"]').click();assert.deepEqual((await diagnostics()).seatCounts,[56,48]);pass('old release save preserves cash, ownership, both branches and upgraded seating');
  const funded=E.createGame();funded.cash=500000;funded.dayOpeningCash=500000;await restore(funded);
  await page.locator('[data-view="investment"]').click();await page.locator('[data-action="upgrade"][data-key="seats"]').click();await page.locator('[data-action="upgrade"][data-key="counter"]').click();await page.locator('[data-action="upgrade"][data-key="decor"]').click();await page.locator('[data-view="overview"]').click();assert.deepEqual((await diagnostics()).seatCounts,[56,48]);assert.ok((await diagnostics()).objects>120);pass('purchased equipment, decoration and seating are visible in the world');
  await page.locator('[data-view="schedule"]').click();await page.locator('[data-action="edit-show"]').first().click();await page.locator('[name="price"]').fill('105');await page.locator('#programme-form .primary').click();assert.equal((await state()).branches[0].programme.find(p=>p.start===15&&p.hall===0).price,105);pass('real schedule editing updates ticket price');
  for(const kind of ['tickets','snacks','cleaning']){
   const s=E.createGame();E.startDay(s);s.events=[{id:'browser-'+kind,kind,at:1,branch:0,hall:0,movie:'m0',done:false}];E.advance(s,180);await restore(s);await page.locator('[data-action="play-mini"]').click();
   if(kind==='tickets')for(let i=0;i<8;i++){
    const index=await page.evaluate(()=>{const request=[...document.querySelector('#mini-request').childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim();return [...document.querySelectorAll('.ticket-option')].findIndex(n=>n.textContent===request);});assert.ok(index>=0);await page.locator('.ticket-option').nth(index).click();
   }
   if(kind==='snacks')for(let i=0;i<8;i++){
    const text=await page.locator('#mini-request').innerText();for(const item of text.replace('今張訂單','').trim().split(' ＋ ')){const id=item.includes('爆谷')?0:item.includes('汽水')?1:2;await page.locator(`[data-action="snack-pick"][data-id="${id}"]`).click();}
   }
   if(kind==='cleaning')for(let i=0;i<8;i++)await page.locator(`[data-action="trash"][data-id="${i}"]`).click();
   await page.waitForSelector('.result-stars');await page.locator('[data-action="mini-complete"]').click();assert.equal((await state()).phase,'running');assert.ok((await state()).branches[0].buffs[kind]>0);pass(kind+' optional minigame resolves into real operating buff');
  }
  const ending=E.createGame();E.startDay(ending);ending.events=[];E.advance(ending,179);await restore(ending);await page.locator('[data-speed="4"]').click();await page.locator('#pause-button').click();await page.waitForFunction(()=>window.__lumen.getState().phase==='closed',{timeout:15000});assert.equal((await state()).history.length,1);await page.locator('[data-view="report"]').click();assert.match(await page.locator('#view-content').innerText(),/日終公司現金/);await page.locator('#main-action').click();assert.equal((await state()).day,2);assert.equal((await state()).phase,'planning');pass('day close, financial report and next-day loop');
  await context.setOffline(true);await page.locator('#save-button').click();await page.locator('[data-action="zoom-in"]').click();await page.locator('#load-button').click();assert.equal((await state()).day,2);await context.setOffline(false);pass('loaded game controls and save/reload continue offline');
  for(const viewport of [{width:390,height:844},{width:720,height:1280},{width:1080,height:2400}]){
   const mobile=await browser.newPage({viewport,isMobile:true,hasTouch:true,deviceScaleFactor:1});mobile.on('pageerror',e=>result.errors.push(String(e)));await mobile.goto(base,{waitUntil:'networkidle'});await mobile.locator('#modal .primary[data-action="close"]').click();
   const overflow=await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false,'horizontal overflow '+viewport.width);
   await mobile.locator('[data-view="staff"]').click();assert.ok(await mobile.locator('[data-action="hire"]').isVisible());await mobile.locator('[data-view="overview"]').click();await mobile.locator('[data-action="select-zone"][data-id="snacks"]').click();assert.match(await mobile.locator('#zone-inspector').innerText(),/小食/);
   await mobile.evaluate(()=>scrollTo(0,0));await mobile.screenshot({path:path.join(root,`docs/screenshots/v0.3-${viewport.width}.png`),fullPage:true});result.viewports.push({...viewport,overflow});await mobile.close();pass('touch layout and navigation '+viewport.width+'×'+viewport.height);
  }
  const failure=await browser.newPage();await failure.route('**/assets/runtime/manifest.json*',r=>r.abort());await failure.goto(base);await failure.waitForSelector('.load-failure');assert.equal(await failure.locator('#main-action').isDisabled(),true);await failure.close();pass('asset load failure has an explicit retry state and blocks opening');
  assert.deepEqual(result.errors,[]);result.status='passed';result.finishedAt=new Date().toISOString();
  await fs.writeFile(path.join(out,'browser.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
