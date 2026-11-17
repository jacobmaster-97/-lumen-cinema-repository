// Regression checks against actual canvas/scene implementations; no player storage.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
(async()=>{
 const E=await import('../prototypes/browser/engine.mjs'),s=E.createGame();s.cash=300000;for(let n=0;n<3;n++)E.upgrade(s,0,'seats');E.openBranch(s);s.activeBranch=0;s.branches[1].programme=E.suggestProgramme(s,1);assert.equal(E.startDay(s),null);s.events=[];for(let n=0;n<200;n++)E.advance(s,180/780);
 const base=process.env.CINEMA_TEST_URL||'http://127.0.0.1:8342/pages/',out=path.resolve(__dirname,'../production/verification/v0.7.1'),browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 try{const p=await browser.newPage({viewport:{width:844,height:390},deviceScaleFactor:2}),errors=[];p.on('pageerror',e=>errors.push(String(e)));await p.route('**/cache-test.html',r=>r.fulfill({contentType:'text/html',body:'<body style="margin:0"><div style="width:100vw;height:100vh"><canvas style="width:100%;height:100%"></canvas></div></body>'}));await p.goto(base+'cache-test.html');
 const result=await p.evaluate(async({s,base})=>{
  const [{CinemaRenderer},{loadCinemaAssets}]=await Promise.all([import(base+'render.mjs'),import(base+'assets.mjs')]),{manifest,images}=await loadCinemaAssets(),r=new CinemaRenderer(document.querySelector('canvas'),manifest,images),checks=[],check=(yes,message)=>{if(!yes)throw Error(message);checks.push(message)},same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),before=JSON.stringify(s);
  const warm=async()=>{for(let n=0;n<75;n++)await new Promise(resolve=>requestAnimationFrame(()=>{r.render(s,0);resolve()}))};
  await warm();const first=r.layerCache,bitmaps=[...first.images.values()];check(first.images.size>0,'static layers warm on the actual canvas');check(first.bytes<=24*1024*1024,'scaled cache stays within 24MiB');
  const ids=r.getDiagnostics().visiblePatrons;check(ids.length>0,'fixture includes real visible customers');r.useLayerCache=false;r.render(s,0);check(same(ids,r.getDiagnostics().visiblePatrons),'cache toggle preserves every visible patron ID and stage');r.useLayerCache=true;
  r.camera.x=30;r.dirty=true;r.render(s,0);check(r.layerCache===first,'panning reuses scale cache');
  r.zoom(1.4);r.render(s,0);check(r.layerCache!==first&&bitmaps.every(c=>!c.width&&!c.height),'zoom releases prior canvas backing stores');await warm();const zoomed=r.layerCache;check(zoomed.bytes<=24*1024*1024,'maximum zoom has bounded cache with direct-draw fallback');
  s.activeBranch=1;r.render(s,0);check(r.layerCache!==zoomed&&r.layerCache.scene===r.scene,'branch switch invalidates display cache');await warm();
  const old=r.scene;s.branches[1].seats=s.branches[1].seats.map(n=>n+8);r.render(s,0);check(r.scene!==old&&r.layerCache.scene===r.scene,'capacity change rebuilds scene, seats and layer cache');
  s.activeBranch=0;
  // Restore the deliberately changed test-only capacity before checking full state.
  s.branches[1].seats=s.branches[1].seats.map(n=>n-8);check(JSON.stringify(s)===before,'all render operations leave authoritative game state unchanged');
  r.render(s,0);window.cacheRenderer=r;window.cacheState=s;window.cacheBeforeResize=r.layerCache;
  return{checks,cacheBytes:zoomed.bytes,visiblePatrons:ids?.length||0};
 },{s,base});
 await p.setViewportSize({width:1024,height:768});await p.waitForTimeout(100);result.tablet=await p.evaluate(()=>{const r=window.cacheRenderer;r.render(window.cacheState,0);if(r.canvas.width*r.canvas.height>1253000||r.canvas.width<1024)throw Error('tablet pixel budget');return r.getDiagnostics().canvasPixels});result.checks.push('tablet raster budget caps Retina workload without shrinking CSS viewport');await p.setViewportSize({width:640,height:320});await p.waitForTimeout(100);result.resize=await p.evaluate(()=>{const r=window.cacheRenderer;r.render(window.cacheState,0);if(r.layerCache===window.cacheBeforeResize)throw Error('resize did not invalidate cache');const size=[r.canvas.width,r.canvas.height];r.dispose();if(r.layerCache!==null)throw Error('dispose retained cache');return{canvas:size,disposed:true}});result.checks.push('DPR2 resize invalidates cache; disposal releases current cache');assert.deepEqual(errors,[]);result.errors=errors;result.status='passed';await fs.mkdir(out,{recursive:true});await fs.writeFile(path.join(out,'render-cache.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
