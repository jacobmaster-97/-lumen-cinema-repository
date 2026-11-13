import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as E from '../../prototypes/browser/engine.mjs';
import { worldObjects, placement, Navigation, customerRoutes, elevation, overlaps, hallUnderRepair, pickRoom, project } from '../../prototypes/browser/world.mjs';
const manifest=JSON.parse(await readFile(new URL('../../src/assets/cinema/runtime/manifest.json',import.meta.url),'utf8'));
const {layout,assets}=manifest;
test('a real save produced by the previous release keeps cash, property, branches and upgraded capacity',async()=>{
  const raw=await readFile(new URL('./fixtures/v2-save.json',import.meta.url),'utf8'),old=JSON.parse(raw).state,restored=E.loadGame(raw);
  assert.equal(restored.cash,old.cash);assert.equal(restored.activeBranch,1);assert.equal(restored.branches[0].owned,true);
  assert.deepEqual(restored.branches.map(b=>b.seats),[[56,48],[48,40]]);
  for(const b of restored.branches){const objects=worldObjects(layout,b);assert.deepEqual([0,1].map(h=>objects.filter(o=>o.room===`hall${h+1}`&&o.kind==='seat').length),b.seats);}
});
test('planning never displays a false repair; a real closure follows the running clock',()=>{
  const s=E.createGame(),b=s.branches[0];assert.equal(hallUnderRepair(b,s,0),false);
  s.phase='running';s.minute=20;b.closedUntil[0]=45;assert.equal(hallUnderRepair(b,s,0),true);
  s.minute=45;assert.equal(hallUnderRepair(b,s,0),false);
});

test('production map has two elevated eight-row halls, no lounge, and ground-level entries',()=>{
  assert.deepEqual(layout.grid,[32,34]);assert.ok(!layout.rooms.some(r=>r.id==='lounge'));assert.ok(!layout.objects.some(o=>o.kind==='bench'));
  for(const t of layout.terraces){assert.equal(t.tiers.length,8);assert.equal(t.tiers[0].elevation_m,0);assert.equal(t.tiers[7].elevation_m,2.1);assert.equal(t.stair_rise_m,.15);assert.equal(elevation(layout,(t.aisle_x[0]+t.aisle_x[1])/2,17.25),2.1);}
  for(const d of layout.doors.filter(d=>d.room.startsWith('hall'))){assert.equal(d.threshold_m,0);assert.ok(d.b<layout.terraces[0].tiers[0].front_y);}
  assert.equal(pickRoom(layout,...project(2.5,15.875,2.1)).id,'hall1');
  assert.equal(pickRoom(layout,...project(28.5,15.875,2.1)).id,'hall2');
});

for(let level=0;level<=3;level++)test(`level ${level}: rendered capacity, furniture clearance and elevated navigation agree`,()=>{
  const b=E.branch(0);b.seats=b.seats.map(n=>n+8*level);for(const k of Object.keys(b.upgrades))b.upgrades[k]=level;
  const objects=worldObjects(layout,b),props=objects.map(o=>placement(o,assets));
  assert.deepEqual([0,1].map(h=>objects.filter(o=>o.kind==='seat'&&o.room===`hall${h+1}`).length),b.seats);
  for(const p of props){
    const room=layout.rooms.find(r=>r.id===p.room),[x,y,w,h]=p.footprint,[X,Y,W,H]=room.rect;
    assert.ok(x>=X-1e-8&&y>=Y-1e-8&&x+w<=X+W+1e-8&&y+h<=Y+H+1e-8,p.id+' stays in its room');
    assert.ok(layout.doors.every(d=>!overlaps(p.footprint,d.clear)),p.id+' keeps door clear');
    assert.ok(layout.corridors.every(c=>!overlaps(p.footprint,c.rect)),p.id+' keeps circulation clear');
    assert.ok(layout.queues.every(q=>!overlaps(p.footprint,q.rect)),p.id+' keeps queue clear');
    if(p.kind==='seat'){const [a,b,c,d,e,f]=p.matrix;assert.ok(Math.abs(c)<1e-9);for(let i=0;i<3;i++){const [u,v]=p.spec.base_quad[i];assert.ok(Math.hypot(a*u+c*v+e-p.target[i][0],b*u+d*v+f-p.target[i][1])<1e-7);}assert.equal(p.elevation_m,elevation(layout,x+w/2,y+h/2));}
  }
  for(let i=0;i<props.length;i++)for(let j=i+1;j<props.length;j++)assert.ok(!overlaps(props[i].footprint,props[j].footprint),props[i].id+' overlaps '+props[j].id);
  const nav=new Navigation(layout,objects,assets);
  for(const [name,end]of Object.entries(layout.destinations)){
    const path=nav.route(layout.entrance,end);assert.ok(path.length>0,'reachable '+name);
    for(let i=1;i<path.length;i++){assert.ok(Math.abs(path[i][2]-path[i-1][2])<=.1500001);assert.ok(Math.abs(path[i][0]-path[i-1][0])+Math.abs(path[i][1]-path[i-1][1])<=.500001);}
  }
  for(const path of customerRoutes(layout,nav)){assert.ok(path.length>100);assert.equal(path.at(-1)[2],2.1);}
});

test('navigation does not teleport through furniture or directly down a two-metre rear platform',()=>{
  const b=E.branch(0),nav=new Navigation(layout,worldObjects(layout,b),assets);
  assert.deepEqual(nav.route([9.25,23.25],layout.entrance),[]);
  const path=nav.route(layout.destinations['hall1-rear'],[7.25,19.25]);
  assert.ok(path.length>55);assert.ok(path.some(p=>p[0]>14&&p[1]<6));
});

test('actual runtime PNGs and frame metadata stay within their source images',async()=>{
  const headers={};for(const [key,file]of Object.entries(manifest.files)){const raw=await readFile(new URL('../../src/assets/cinema/runtime/'+file,import.meta.url));assert.equal(raw.subarray(1,4).toString(),'PNG');headers[key]=[raw.readUInt32BE(16),raw.readUInt32BE(20)];}
  assert.equal(manifest.actors.frames.length,16);assert.equal(manifest.posters.film_ids.length,E.MOVIES.length);
  assert.deepEqual([...manifest.posters.base_film_ids,...manifest.posters.extra.film_ids].sort(),E.MOVIES.map(m=>m.id).sort());
  for(const frame of manifest.actors.frames){const [x,y,w,h]=frame.region;assert.ok(x>=0&&y>=0&&x+w<=headers.actors[0]&&y+h<=headers.actors[1]);}
  for(const p of assets){const [x,y,w,h]=p.region;assert.ok(x>=0&&y>=0&&x+w<=headers.props[0]&&y+h<=headers.props[1]);}
  assert.deepEqual(headers.posters,manifest.posters.size);
});
