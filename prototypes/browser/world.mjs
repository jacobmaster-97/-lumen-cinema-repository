// World geometry and navigation have no DOM or financial side effects.
export const WORLD = { width: 1800, height: 1320, tileWidth: 48, tileHeight: 24, x: 900, y: 270, vertical: 32 };
export const project = (x, y, metres = 0) => [WORLD.x + (x-y)*24, WORLD.y + (x+y)*12 - metres*32];
export const unproject = (x,y) => {const u=(x-WORLD.x)/24,v=(y-WORLD.y)/12;return [(u+v)/2,(v-u)/2];};
export const inside = (x,y,r) => x>=r[0] && y>=r[1] && x<r[0]+r[2] && y<r[1]+r[3];
export const overlaps = (a,b) => Math.max(a[0],b[0])<Math.min(a[0]+a[2],b[0]+b[2])-1e-8 && Math.max(a[1],b[1])<Math.min(a[1]+a[3],b[1]+b[3])-1e-8;
export const hallUnderRepair = (branch,state,hall) => state.phase!=='planning' && branch.closedUntil[hall]>Math.max(0,state.minute);

export function elevation(layout,x,y) {
  const t=layout.terraces.find(t=>inside(x,y,layout.rooms.find(r=>r.id===t.room).rect));
  if(!t || y<t.tiers[0].front_y)return 0;
  if(y>=t.rear_walkway[1])return t.rear_elevation_m;
  const tier=t.tiers.find(r=>y>=r.front_y && y<r.back_y);
  if(!tier)return 0;
  const index=tier.row-1;
  if(index && x>t.aisle_x[0] && x<t.aisle_x[1])return t.tiers[index-1].elevation_m + (y<(tier.front_y+tier.back_y)/2?t.stair_rise_m:2*t.stair_rise_m);
  return tier.elevation_m;
}

export function pickRoom(layout,screenX,screenY){
  // A ground-only inverse misses elevated rear-row corners. Intersect each
  // authored floor height and keep the closest matching surface instead.
  const levels=[0,...layout.terraces.flatMap(t=>t.tiers.flatMap(r=>[r.elevation_m,Math.max(0,r.elevation_m-t.stair_rise_m)]))],hits=[];
  for(const z of new Set(levels)){
    const [x,y]=unproject(screenX,screenY+z*32),room=layout.rooms.find(r=>inside(x,y,r.rect));
    if(room&&Math.abs(elevation(layout,x,y)-z)<.001)hits.push({room,depth:x+y});
  }
  return hits.sort((a,b)=>b.depth-a.depth)[0]?.room||null;
}

function columns(room,aisle,count,base) {
  if(count===base.length)return base;
  const [x,,w]=room.rect,left=Math.ceil(count/2),right=count-left;
  const spread=(n,a,b)=>Array.from({length:n},(_,i)=>n===1?(a+b)/2:a+(b-a)*i/(n-1));
  return [...spread(left,x+.5,aisle[0]-.5),...spread(right,aisle[1]+.5,x+w-.5)];
}

export function worldObjects(layout,branch) {
  const objects=layout.objects.filter(o=>o.kind!=='seat').map(o=>({...o,rect:o.rect.slice()}));
  if(branch.upgrades.decor>0)objects.push({id:'poster-left',kind:'poster',room:'tickets',rect:[12.2,21.5,.6,.5]});
  if(branch.upgrades.decor>1)objects.push({id:'poster-right',kind:'poster',room:'snacks',rect:[18.5,21.5,.6,.5]});
  if(branch.upgrades.decor>2)objects.push({id:'plant-staff',kind:'plant',room:'staff',rect:[6.75,33.2,.65,.65]});
  const equipment=[[20.9,21.7,1.1,.9],[20.9,22.9,1.1,.9],[22.3,21.2,.9,1]];
  for(let i=0;i<branch.upgrades.counter;i++)objects.push({id:`snack-equipment-${i}`,asset_id:i===1?'machine-popcorn':'machine-soda',kind:'machine',room:'snacks',rect:equipment[i]});
  for(let h=0;h<2;h++) {
    const room=layout.rooms.find(r=>r.id===`hall${h+1}`),t=layout.terraces[h],capacity=Math.max(0,Math.min(72,Math.round(branch.seats[h])));
    const base=h?[19.5,21,22.5,27,28.5]:[2.5,4,5.5,8.5,10,11.5];
    const xs=columns(room,t.aisle_x,Math.ceil(capacity/8),base);
    let used=0;
    for(const row of t.tiers)for(let c=0;c<xs.length && used<capacity;c++,used++)objects.push({id:`${room.id}-r${String(row.row).padStart(2,'0')}-c${String(c+1).padStart(2,'0')}`,kind:'seat',room:room.id,row:row.row,rect:[xs[c]-.4,row.seat_y-.35,.8,.7],elevation_m:row.elevation_m});
  }
  return objects;
}

export function placement(object,assets) {
  const spec=assets.find(a=>object.asset_id?a.id===object.asset_id:a.kind===object.kind&&(!a.object_ids||a.object_ids.includes(object.id)));
  if(!spec)throw Error(`Missing sprite: ${object.id}`);
  const [rx,ry,rw,rh]=object.rect,[A,B,D]=spec.base_quad;
  const ratio=(B[0]-A[0])/(A[0]-D[0]),w=Math.min(rw,rh*ratio),h=w/ratio,x=rx+(rw-w)/2,y=ry+(rh-h)/2,z=object.elevation_m||0;
  const target=[project(x,y,z),project(x+w,y,z),project(x,y+h,z)];
  const det=(B[0]-A[0])*(D[1]-A[1])-(B[1]-A[1])*(D[0]-A[0]);
  const ux=(D[1]-A[1])/det,uy=-(D[0]-A[0])/det,vx=-(B[1]-A[1])/det,vy=(B[0]-A[0])/det;
  const bx=target[1][0]-target[0][0],by=target[1][1]-target[0][1],dx=target[2][0]-target[0][0],dy=target[2][1]-target[0][1];
  const matrix=[bx*ux+dx*vx,by*ux+dy*vx,bx*uy+dx*vy,by*uy+dy*vy,0,0];
  matrix[4]=target[0][0]-matrix[0]*A[0]-matrix[2]*A[1];matrix[5]=target[0][1]-matrix[1]*A[0]-matrix[3]*A[1];
  const [,,sw,sh]=spec.region,pixels=[[0,0],[sw,0],[sw,sh],[0,sh]].map(([u,v])=>[matrix[0]*u+matrix[2]*v+matrix[4],matrix[1]*u+matrix[3]*v+matrix[5]]);
  return {...object,footprint:[x,y,w,h],spec,matrix,target:[...target,project(x+w,y+h,z)],depth:x+y+(w+h)/2+.2,bounds:[Math.min(...pixels.map(p=>p[0])),Math.min(...pixels.map(p=>p[1])),Math.max(...pixels.map(p=>p[0])),Math.max(...pixels.map(p=>p[1]))]};
}

function crosses(p,q,w) {
  const i=w.axis==='h'?1:0,j=1-i;
  if((p[i]-w.line)*(q[i]-w.line)>=0)return false;
  const at=p[j]+(q[j]-p[j])*(w.line-p[i])/(q[i]-p[i]);
  return at>w.a+1e-8 && at<w.b-1e-8;
}

export class Navigation {
  constructor(layout,objects,assets) {
    this.layout=layout;this.width=layout.grid[0]*2;this.height=layout.grid[1]*2;this.cache=new Map();
    this.obstacles=(layout.obstacles||objects.map(o=>placement(o,assets).footprint)).concat(layout.terraces.map(t=>t.stage.rect));
    this.walls=layout.walls.concat(layout.queues.map(q=>({axis:'h',line:q.rail[1],a:q.rail[0],b:q.rail[2]})));
    this.walkable=new Uint8Array(this.width*this.height);this.heights=new Float64Array(this.walkable.length);this.links=new Array(this.walkable.length);
    for(let n=0;n<this.walkable.length;n++){
      const [x,y]=this.point(n);this.heights[n]=elevation(layout,x,y);
      this.walkable[n]=(!layout.floorBlocks||layout.floorBlocks.includes(`${Math.floor(x/8)},${Math.floor(y/8)}`))&&!this.obstacles.some(([a,b,w,h])=>x>a-.18&&x<a+w+.18&&y>b-.18&&y<b+h+.18);
    }
    for(let n=0;n<this.walkable.length;n++){
      this.links[n]=[];if(!this.walkable[n])continue;const p=this.point(n),x=n%this.width,y=Math.floor(n/this.width);
      for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){
        const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=this.width||Y>=this.height)continue;
        const m=Y*this.width+X,q=this.point(m);
        if(this.walkable[m]&&Math.abs(this.heights[m]-this.heights[n])<=.1500001&&!this.walls.some(w=>crosses(p,q,w)))this.links[n].push(m);
      }
    }
  }
  point(n){return [(n%this.width)/2+.25,Math.floor(n/this.width)/2+.25,this.heights?.[n]||0];}
  node([x,y]){const X=Math.round((x-.25)*2),Y=Math.round((y-.25)*2);return X<0||Y<0||X>=this.width||Y>=this.height?-1:Y*this.width+X;}
  route(start,end) {
    const a=this.node(start),b=this.node(end),key=`${a}:${b}`;
    if(this.cache.has(key))return this.cache.get(key);
    if(a<0||b<0||!this.walkable[a]||!this.walkable[b])return [];
    const parent=new Int32Array(this.walkable.length);parent.fill(-1);parent[a]=a;
    const queue=[a];let cursor=0;
    while(cursor<queue.length && parent[b]===-1){const n=queue[cursor++];for(const m of this.links[n])if(parent[m]===-1){parent[m]=n;queue.push(m);}}
    if(parent[b]===-1)return [];
    const route=[];for(let n=b;;n=parent[n]){route.push(this.point(n));if(n===a)break;}route.reverse();this.cache.set(key,route);return route;
  }
  through(points){
    // A Navigation belongs to one immutable scene; reuse joined paths as well as their legs.
    const key='via:'+points.map(p=>this.node(p)).join(':');
    if(this.cache.has(key))return this.cache.get(key);
    const out=[];for(let i=0;i<points.length-1;i++){const leg=this.route(points[i],points[i+1]);if(!leg.length){this.cache.set(key,[]);return this.cache.get(key)}out.push(...leg.slice(i?1:0));}
    this.cache.set(key,out);return out;
  }
}

export function sampleRoute(route,progress) {
  if(!route.length)return null;
  const index=Math.min(route.length-1,Math.max(0,progress)*(route.length-1)),n=Math.floor(index),next=Math.min(route.length-1,n+1),f=index-n,a=route[n],b=route[next];
  return {x:a[0]+(b[0]-a[0])*f,y:a[1]+(b[1]-a[1])*f,z:a[2]+(b[2]-a[2])*f,dx:b[0]-a[0],dy:b[1]-a[1]};
}

export function customerRoutes(layout,nav) {
  if(layout.modular)return [0,1].map(h=>layout.destinations[`hall${h+1}-rear`]&&layout.destinations.tickets&&layout.destinations.snacks?nav.through([layout.entrance,layout.destinations.tickets,layout.destinations.snacks,layout.destinations[`hall${h+1}-entry`],layout.destinations[`hall${h+1}-front`],layout.destinations[`hall${h+1}-rear`]]):[]);
  return [0,1].map(h=>nav.through([layout.entrance,...layout.queues[0].points,...layout.queues[1].points,layout.destinations[`hall${h+1}-entry`],layout.destinations[`hall${h+1}-rear`]]));
}
