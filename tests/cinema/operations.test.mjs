import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as E from '../../prototypes/browser/engine.mjs';
import * as C from '../../prototypes/browser/construction.mjs';
import {modularLayout} from '../../prototypes/browser/map-world.mjs';
import {Navigation,placement} from '../../prototypes/browser/world.mjs';
import {queuePosition,patronRoute,sceneSeats} from '../../prototypes/browser/operations-world.mjs';
const finish=s=>{E.advance(s,180);assert.equal(s.phase,'closed');return s};
const start=s=>{assert.equal(E.startDay(s),null);s.events=[];return s};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-5,`${a} versus ${b}`);
test('seat lookup preserves source order and updates for a replacement scene or upgraded props',()=>{
 const a={kind:'seat',room:'hall1',id:'a'},b={kind:'seat',room:'hall2',id:'b'},c={kind:'seat',room:'hall1',id:'c'};
 const scene={props:[a,b,{kind:'screen',room:'hall1'},c]},seats=sceneSeats(scene,0);
 assert.deepEqual(seats,[a,c]);assert.equal(sceneSeats(scene,0),seats);assert.deepEqual(sceneSeats(scene,1),[b]);
 const other={props:[c]};assert.deepEqual(sceneSeats(other,0),[c]);assert.equal(sceneSeats(scene,0),seats);
 scene.props=[c,a];assert.deepEqual(sceneSeats(scene,0),[c,a]);assert.deepEqual(sceneSeats(scene,1),[]);
});
test('each minute reconciles real ticket holders, admissions, food and company money',()=>{
 const s=start(E.createGame()),b=s.branches[0],cash=s.cash,stages=new Set();let transactions=0;
 for(let n=0;n<=780;n++){
  E.advance(s,180/780);const f=b.flow,holders=f.patrons.filter(c=>c.ticket);for(const c of f.patrons)stages.add(c.stage);
  near(b.ledger.gross,holders.reduce((a,c)=>a+c.price,0));near(b.ledger.share,holders.reduce((a,c)=>a+c.share,0));assert.equal(b.ledger.ticketsSold,holders.length);assert.equal(b.ledger.admissions,holders.filter(c=>c.admitted).length);assert.equal(b.ledger.groups.reduce((a,n)=>a+n,0),b.ledger.admissions);
  const food=b.shows.reduce((a,p)=>a.map((v,i)=>v+p.food[i]),[0,0,0]);assert.deepEqual(food,b.ledger.snackUnits);near(b.ledger.foodCost,food.reduce((a,n,i)=>a+n*E.FOODS[i].cost,0));near(b.ledger.foodRevenue,food.reduce((a,n,i)=>a+n*b.foods[i],0));
  near(s.cash,cash+E.net(b.ledger));for(const p of b.shows){assert.ok(p.served<=p.sold&&p.sold<=b.seats[p.hall]);const seatHolders=holders.filter(c=>c.show===p.id);assert.equal(new Set(seatHolders.map(c=>c.seat)).size,seatHolders.length)}if(n>0&&b.ledger.gross>0)transactions++;
 }
 assert.equal(s.phase,'closed');assert.ok(transactions>20);for(const stage of ['ticket-queue','snack-queue','seated','exiting','leaving'])assert.ok(stages.has(stage),stage);assert.ok(b.ledger.admissions>200);
});
test('ticket sales happen gradually before showtime, not in a lump on opening',()=>{const s=start(E.createGame()),b=s.branches[0];E.advance(s,1);const first=b.ledger.ticketsSold;assert.ok(first>0);assert.equal(b.shows.some(p=>p.booked),false);E.advance(s,1);assert.ok(b.ledger.ticketsSold>first);assert.ok(b.ledger.gross>0)});
test('staff capacity and waiting patience cause real ticket and snack losses',()=>{
 const a=E.createGame(),b=E.createGame();a.branches[0].staff=a.branches[0].staff.filter(p=>p.role!=='tickets'&&p.role!=='snacks');finish(start(a));finish(start(b));assert.ok(a.branches[0].ledger.lost>b.branches[0].ledger.lost);assert.ok(a.branches[0].flow.losses.wait>0);assert.equal(a.branches[0].ledger.foodRevenue,0);assert.ok(b.branches[0].ledger.foodRevenue>0);assert.ok(b.branches[0].ledger.admissions>a.branches[0].ledger.admissions);const manual=E.createGame();manual.branches[0].staff=manual.branches[0].staff.filter(p=>p.role!=='snacks');start(manual);manual.events=[{id:'manual-empty-counter',kind:'snacks',at:0,branch:0,done:false}];E.advance(manual,180);assert.equal(E.resolveEvent(manual,'manual',1),null);manual.events=[];finish(manual);assert.ok(manual.branches[0].ledger.foodRevenue>0);
});
test('cleaning begins after departure and insufficient cleaners delay following shows',()=>{
 const a=E.createGame(),b=E.createGame();a.branches[0].staff=a.branches[0].staff.filter(p=>p.role!=='cleaning');start(a);start(b);let sawCleaning=false,sawExiting=false;
 for(let n=0;n<780;n++){E.advance(a,180/780);const q=E.operationsSnapshot(a,0);sawCleaning||=q.halls.some(h=>h.state==='cleaning'&&h.remaining>0);sawExiting||=q.halls.some(h=>h.state==='exiting')}
 finish(a);finish(b);assert.ok(sawCleaning&&sawExiting);assert.ok(a.branches[0].ledger.delay>b.branches[0].ledger.delay);assert.ok(a.branches[0].ledger.admissions<b.branches[0].ledger.admissions);
});
test('cancellation refunds sold tickets once while consumed food is retained',()=>{
 const s=start(E.createGame()),b=s.branches[0],p=b.shows[0];E.advance(s,2);assert.ok(p.sold>0);const price=p.price,share=E.movie(p.movie).share,sold=p.sold,food=b.ledger.foodRevenue,cash=s.cash;
 s.events=[{id:'withdraw',kind:'withdrawal',at:s.minute+1,branch:0,hall:p.hall,movie:p.movie,done:false}];E.advance(s,180);assert.equal(s.phase,'event');const before=s.cash;assert.equal(E.resolveEvent(s,'cancel'),null);near(s.cash,before-sold*price*(1-share));assert.equal(p.sold,0);assert.ok(b.ledger.foodRevenue>=food);const after=s.cash;E.advance(s,180/780);assert.equal(s.cash,after);assert.ok(cash>=0);finish(s);
});
test('replacement honours ticket price and corrects distributor share without double charging',()=>{
 const s=start(E.createGame()),b=s.branches[0],p=b.shows[0];E.advance(s,2);assert.ok(p.sold>0);s.events=[{id:'replace',kind:'withdrawal',at:s.minute+1,branch:0,hall:p.hall,movie:p.movie,done:false}];E.advance(s,180);const replacement=E.replacementOptions(s,E.currentEvent(s))[0];assert.ok(replacement);assert.equal(E.resolveEvent(s,'replace',0,replacement.id),null);assert.ok(b.flow.patrons.filter(c=>c.show===p.id&&c.ticket).every(c=>c.price===p.price&&Math.abs(c.share-c.price*replacement.share)<1e-6));finish(s);
});
test('queue save resumes exact customers and finances without duplicate sales',()=>{const a=start(E.createGame());E.advance(a,2);assert.ok(a.branches[0].flow.patrons.some(c=>c.stage==='ticket-queue'));const b=E.loadGame(E.saveGame(a));assert.equal(b.paused,true);b.paused=false;finish(a);finish(b);near(a.cash,b.cash);assert.deepEqual(a.branches[0].ledger,b.branches[0].ledger);assert.deepEqual(a.branches[0].flow,b.branches[0].flow)});
test('invalid flow saves fail atomically rather than resetting or awarding money',()=>{const s=start(E.createGame());E.advance(s,2);for(const corrupt of [s=>s.branches[0].flow.patrons[0].group=99,s=>s.branches[0].flow.patrons[0].stage='free-money',s=>s.branches[0].flow.halls[0].remaining=-1,s=>s.branches[0].flow.credits.tickets=Infinity,s=>s.branches[0].flow.patrons[1].id=s.branches[0].flow.patrons[0].id]){const copy=structuredClone(s);corrupt(copy);assert.throws(()=>E.loadGame(E.saveGame(copy)),/客流|工作|排隊/)}assert.ok(s.cash>0)});
test('legacy running day keeps prior settlement and adopts flow only on next day',()=>{const s=start(E.createGame());delete s.branches[0].flow;for(const p of s.branches[0].shows){p.served=0;p.booked=false}const loaded=E.loadGame(E.saveGame(s));loaded.paused=false;assert.equal(loaded.branches[0].flow,undefined);finish(loaded);E.nextDay(loaded);start(loaded);assert.equal(loaded.branches[0].flow.version,1)});
test('forecast is a pure no-event dry-run of live operation including all overhead',()=>{const s=E.createGame(),before=JSON.stringify(s),f=E.forecastProgramme(s,0);assert.equal(JSON.stringify(s),before);const live=finish(start(structuredClone(s))),b=live.branches[0];near(f.net,E.net(b.ledger));assert.equal(f.admissions,b.ledger.admissions);assert.equal(f.lost,b.ledger.lost);near(f.share,b.ledger.share);near(f.net,f.ticketNet+f.foodProfit-f.wages-f.rent-f.maintenance);assert.ok(f.low<=f.net&&f.high>=f.net);assert.equal(f.rows.length,8);assert.ok(f.rows.every(r=>r.groups.length===6));assert.match(f.basis,/不含突發事件/)});
test('forecast responds to unsaved price, film, time and staffing and validates impossible plans',()=>{const s=E.createGame(),b=s.branches[0],initialPrice=b.programme[0].price,base=E.forecastProgramme(s,0),high=b.programme.map(p=>({...p,price:300})),forecast=E.forecastProgramme(s,0,high);assert.ok(forecast.admissions<base.admissions);assert.equal(b.programme[0].price,initialPrice);const changed=structuredClone(b.programme);changed[0].movie='m1';changed[0].start=0;const f=E.forecastProgramme(s,0,changed);assert.ok(f.net!==base.net||f.admissions!==base.admissions);assert.ok(E.forecastProgramme(s,0,[...b.programme,{...b.programme[0],id:'clash'}]).error);s.branches[0].staff=s.branches[0].staff.filter(p=>p.role!=='snacks');assert.ok(E.forecastProgramme(s,0).foodProfit<base.foodProfit)});
test('forecast and flow support the second independent store',()=>{const s=E.createGame();s.cash=100000;E.openBranch(s);s.branches[1].programme=E.suggestProgramme(s,1);const f=E.forecastProgramme(s,1);assert.equal(f.error,null);finish(start(s));assert.equal(s.history[0].rows.length,2);near(f.net,E.net(s.branches[1].ledger));assert.notEqual(s.branches[0].flow,s.branches[1].flow)});
test('opening an unchanged editor or reordering the same timetable cannot change the forecast',()=>{const s=E.createGame(),plan=s.branches[0].programme,base=E.forecastProgramme(s,0);assert.deepEqual(E.forecastProgramme(s,0,[...plan.slice(1),plan[0]]),base);assert.deepEqual(E.forecastProgramme(s,0,[...plan].reverse()),base)});
test('all displayed queue slots and actual patron stage paths respect map navigation',async()=>{
 const atlas=JSON.parse(await readFile(new URL('../../src/assets/cinema/runtime/manifest.json',import.meta.url),'utf8'));
 const b=E.branch(0);b.map=C.fullMap();const layout=modularLayout(b,atlas.assets),nav=new Navigation(layout,layout.objects,atlas.assets),props=layout.objects.map(o=>placement(o,atlas.assets)),scene={layout,nav,props};
 for(const kind of ['tickets','snacks'])for(let i=0;i<12;i++)assert.ok(nav.route(layout.entrance,queuePosition(layout,kind,i)).length,kind+' '+i);
 for(let hall=0;hall<2;hall++)for(let seat=0;seat<b.seats[hall];seat++)for(const stage of ['arriving','to-snacks','to-hall','exiting','leaving'])for(const from of ['tickets','snacks'])assert.ok(patronRoute(scene,{stage,from,seat},{hall}).length,`${hall} ${seat} ${stage}`);
});
