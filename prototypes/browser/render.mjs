import { movie, operationsSnapshot } from './engine.mjs';
import {queuePosition,patronRoute} from './operations-world.mjs';
import { createCinemaScene } from './scene.mjs';
import { project, unproject, pickRoom, sampleRoute, hallUnderRepair } from './world.mjs';
import * as C from './construction.mjs';

const scenes=new Map();
let posterFrames=new Map();
export function setPosterAssets(images,manifest){
  posterFrames=new Map();const primary={key:'posters',size:manifest.posters.size,grid:[4,4],film_ids:manifest.posters.base_film_ids||manifest.posters.film_ids};
  for(const source of [primary,manifest.posters.extra].filter(Boolean)){
    const [W,H]=source.size,[cols,rows]=source.grid;source.film_ids.forEach((id,i)=>posterFrames.set(id,{image:images[source.key],x:(i%cols)*W/cols,y:Math.floor(i/cols)*H/rows,width:W/cols,height:H/rows}));
  }
}
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

export class CinemaRenderer {
  constructor(canvas,manifest,images,{onSelect=()=>{},camera=null}={}) {
    this.canvas=canvas;this.c=canvas.getContext('2d');this.manifest=manifest;this.images=images;this.onSelect=onSelect;
    this.animation=0;this.selected=null;this.camera=camera||{zoom:1,x:0,y:0};this.dirty=true;this.drawElapsed=0;this.timings=[];this.stats={};
    if(!camera&&canvas.parentElement?.clientWidth>0&&canvas.parentElement.clientWidth<620)this.camera.zoom=1.6;
    this.reducedMotion=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
    const resize=()=>{const r=canvas.parentElement?.getBoundingClientRect();if(r?.width>0&&r?.height>0){const dpr=Math.min(typeof devicePixelRatio==='number'?devicePixelRatio:1,2);canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);this.dirty=true;}};
    resize();if(typeof ResizeObserver==='function'){this.observer=new ResizeObserver(resize);this.observer.observe(canvas.parentElement);}
    this.bindInput();
  }
  dispose(){this.observer?.disconnect();}
  bindInput(){
    const canvas=this.canvas;
    canvas.addEventListener('pointerdown',e=>{this.drag={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:false};canvas.setPointerCapture?.(e.pointerId);});
    canvas.addEventListener('pointermove',e=>{
      if(!this.drag)return;const d=this.drag;
      if(Math.hypot(e.clientX-d.x,e.clientY-d.y)>6)d.moved=true;
      if(d.moved){const r=canvas.getBoundingClientRect();this.camera.x=clamp(this.camera.x+(e.clientX-d.lastX)*canvas.width/r.width,-canvas.width,canvas.width);this.camera.y=clamp(this.camera.y+(e.clientY-d.lastY)*canvas.height/r.height,-canvas.height,canvas.height);this.dirty=true;}
      d.lastX=e.clientX;d.lastY=e.clientY;
    });
    canvas.addEventListener('pointerup',e=>{if(this.drag&&!this.drag.moved){const r=canvas.getBoundingClientRect();this.pick((e.clientX-r.left)*canvas.width/r.width,(e.clientY-r.top)*canvas.height/r.height);}this.drag=null;});
    canvas.addEventListener('pointercancel',()=>this.drag=null);
    canvas.addEventListener('wheel',e=>{if(e.ctrlKey){e.preventDefault();this.zoom(e.deltaY<0?.15:-.15);}},{passive:false});
    canvas.addEventListener('keydown',e=>{const keys={ArrowLeft:[30,0],ArrowRight:[-30,0],ArrowUp:[0,30],ArrowDown:[0,-30]};if(keys[e.key]){e.preventDefault();this.camera.x+=keys[e.key][0];this.camera.y+=keys[e.key][1];this.dirty=true;}if(e.key==='+'||e.key==='=')this.zoom(.2);if(e.key==='-')this.zoom(-.2);if(e.key==='0')this.fit();});
  }
  zoom(change){this.camera.zoom=clamp(this.camera.zoom+change,.8,2.5);this.dirty=true;}
  fit(){this.camera={zoom:1,x:0,y:0,scope:'full'};this.dirty=true;}
  focus(){this.camera={zoom:1,x:0,y:0,scope:'owned'};this.dirty=true;}
  view(){let box=this.scene?.layout.bounds||[-474,210,2748,1480];if(this.scene&&this.camera.scope!=='full'){const points=this.scene.layout.floorBlocks.flatMap(k=>{const [x,y]=k.split(',').map(n=>Number(n)*8);return [project(x,y),project(x+8,y),project(x,y+8),project(x+8,y+8)]}).concat(this.scene.layout.rooms.filter(r=>C.hasRoom(this.state.branches.find(b=>b.id===this.state.activeBranch)||this.state.branches[0],r.id)).flatMap(r=>[project(r.rect[0],r.rect[1],5.5),project(r.rect[0]+r.rect[2],r.rect[1],5.5)]));const a=Math.min(...points.map(p=>p[0]))-40,b=Math.min(...points.map(p=>p[1]))-50,w=Math.max(720,Math.max(...points.map(p=>p[0]))-a+40),h=Math.max(520,Math.max(...points.map(p=>p[1]))-b+50);box=[a-(w-(Math.max(...points.map(p=>p[0]))-a+40))/2,b,w,h]};const [L,T,W,H]=box,s=Math.min(this.canvas.width/W,this.canvas.height/H)*.94*this.camera.zoom;return {s,x:this.canvas.width/2+this.camera.x-(L+W/2)*s,y:this.canvas.height/2+this.camera.y-(T+H/2)*s};}
  pick(x,y){
    if(!this.scene)return;const v=this.view(),room=pickRoom(this.scene.layout,(x-v.x)/v.s,(y-v.y)/v.s);
    const branch=this.state.branches.find(b=>b.id===this.state.activeBranch)||this.state.branches[0];
    if(room&&C.hasRoom(branch,room.id)){this.selected=room.id;this.dirty=true;this.onSelect(room.id);}else{const [a,b]=unproject((x-v.x)/v.s,(y-v.y)/v.s),col=Math.floor(a/8),row=Math.floor(b/8);if(col>=0&&col<7&&row>=0&&row<7)this.onSelect(`block:${col},${row}`)}
  }
  sceneFor(branch){
    const signature=JSON.stringify([branch.seats,branch.upgrades,branch.map]),cached=scenes.get(branch.id);
    if(cached?.signature===signature)return cached.scene;
    const scene=createCinemaScene(this.manifest,this.images,branch);scenes.set(branch.id,{signature,scene});return scene;
  }
  actor(x,y,z,{staff=false,dx=0,dy=-1,index=0,seated=false,moving=true}={}){
    const c=this.c,frame=this.reducedMotion||!moving?0:Math.floor(this.animation*5+index*.3)%2;
    const direction=Math.abs(dx)>Math.abs(dy)?dx>0?1:3:dy>0?0:2;
    const row=(staff?2:0)+frame,spec=this.manifest.actors.frames.find(f=>f.row===row&&f.col===(seated?2:direction));
    const [sx,sy,w,h]=spec.region,[px,py]=project(x,y,z),scale=48/this.manifest.actors.reference_height;
    const left=Math.round(px-spec.anchor[0]*scale),top=Math.round(py-spec.anchor[1]*scale+(seated?11:0));
    c.imageSmoothingEnabled=false;
    if(seated){const crop=Math.round(h*.54);c.drawImage(this.images.actors,sx,sy,w,crop,left,top,w*scale,crop*scale);}
    else c.drawImage(this.images.actors,sx,sy,w,h,left,top,w*scale,h*scale);
  }
  activeShows(branch,state){return [0,1].map(h=>branch.shows.find(p=>!p.cancelled&&p.booked&&p.hall===h&&state.minute>=p.start&&state.minute<p.start+movie(p.movie).length+p.delay));}
  operationalActors(branch,state,actors){
    const scene=this.scene,byId=new Map(branch.shows.map(p=>[p.id,p])),queues={'ticket-queue':0,'snack-queue':0},counts={queued:0,seated:0,walking:0,departing:0},ids=[];
    let unreachable=0;const time=state.elapsed/180*780;
    for(const c of branch.flow.patrons){
      if(['upcoming','gone','withdrawn'].includes(c.stage))continue;
      const p=byId.get(c.show);if(!p)continue;let pos=null,seated=false,moving=false;
      if(c.stage in queues){const index=queues[c.stage]++;if(index>=12)continue;const xy=queuePosition(scene.layout,c.stage==='ticket-queue'?'tickets':'snacks',index);pos={x:xy[0],y:xy[1],z:0,dx:0,dy:-1};counts.queued++}
      else if(c.stage==='seated'){
        const seat=scene.props.filter(o=>o.kind==='seat'&&o.room===`hall${p.hall+1}`)[c.seat];if(!seat)continue;const [x,y,w,h]=seat.footprint;pos={x:x+w/2,y:y+h/2,z:seat.elevation_m,dx:0,dy:-1};seated=true;counts.seated++;
      }else{
        if(counts.walking>=36)continue;const route=patronRoute(scene,c,p,branch.flow.halls[p.hall]);pos=sampleRoute(route,Math.max(0,Math.min(1,(time-c.at)/Math.max(1,c.until-c.at))));if(!pos){unreachable++;continue}moving=state.phase==='running'&&!state.paused;counts.walking++;if(['exiting','leaving'].includes(c.stage))counts.departing++;
      }
      const point=pos;actors.push({depth:point.x+point.y+.32,draw:()=>this.actor(point.x,point.y,point.z,{dx:point.dx,dy:point.dy,index:c.id,seated,moving})});ids.push({id:c.id,stage:c.stage});
    }
    this.stats.patronActors=counts;this.stats.visiblePatrons=ids;this.stats.unreachableActors=unreachable;
  }
  dynamic(branch,state){
    const actors=[],scene=this.scene,shows=this.activeShows(branch,state),running=state.phase==='running'||state.phase==='event';
    for(let h=0;h<2;h++)if(shows[h]){
      const t=scene.layout.terraces.find(t=>t.room===`hall${h+1}`);if(!t)continue;const frame=posterFrames.get(shows[h].movie),s=t.screen;
      if(frame)for(let x=s.x;x<s.x+s.width-.001;x+=.5){
        const length=Math.min(.5,s.x+s.width-x),ratio=length/s.width,left=(x-s.x)/s.width;
        actors.push({depth:x+s.y+.25,draw:()=>{
          const c=this.c,p=project(x,s.y,s.top_m),q=project(x+length,s.y,s.top_m),sourceW=frame.width*ratio,sourceH=frame.width*.52;
          c.save();c.imageSmoothingEnabled=false;c.transform((q[0]-p[0])/sourceW,(q[1]-p[1])/sourceW,0,(s.top_m-s.bottom_m)*32/sourceH,p[0],p[1]);
          c.drawImage(frame.image,frame.x+frame.width*left,frame.y+frame.height*.12,sourceW,sourceH,0,0,sourceW,sourceH);c.restore();
        }});
      }
    }
    if(branch.flow)this.operationalActors(branch,state,actors);
    if(running&&!branch.flow){
      const flow=branch.shows.filter(p=>!p.cancelled).reduce((n,p)=>n+Math.max(0,1-Math.abs(state.minute-p.start)/70)*(p.served||p.demand||10),0),count=Math.min(22,4+Math.floor(flow/4));
      for(let i=0;i<count;i++){
        const hall=i%2;if(hallUnderRepair(branch,state,hall))continue;
        const route=scene.routes[hall];if(!route.length)continue;
        const cycle=(this.animation*.032+i*.271)%1,forward=cycle<.75,progress=forward?cycle/.75:1-(cycle-.75)/.25;
        const p=sampleRoute(route,progress);actors.push({depth:p.x+p.y+.32,draw:()=>this.actor(p.x,p.y,p.z,{dx:p.dx*(forward?1:-1),dy:p.dy*(forward?1:-1),index:i,moving:state.phase==='running'&&!state.paused})});
      }
      for(let h=0;h<2;h++)if(shows[h]){
        const seats=scene.props.filter(p=>p.kind==='seat'&&p.room===`hall${h+1}`),filled=Math.min(shows[h].served,seats.length);
        for(let i=0;i<filled;i++){const p=seats[i],[x,y,w,d]=p.footprint;actors.push({depth:p.depth+.3,draw:()=>this.actor(x+w/2,y+d/2,p.elevation_m,{seated:true,moving:false,index:i})});}
      }
    }
    const jobs={tickets:scene.layout.jobs.tickets||[],snacks:scene.layout.jobs.snacks||[],cleaning:C.operational(branch)?[scene.layout.entrance,scene.layout.destinations.toilets,scene.layout.entrance]:[]};
    for(const role of Object.keys(jobs))branch.staff.filter(p=>p.role===role).slice(0,3).forEach((person,i)=>{
      if(!jobs[role][i])return;let [x,y]=jobs[role][i],z=0,dx=0,dy=1;
      let working=false;
      if(role==='cleaning'&&running){
        const cleaning=branch.flow?.halls.map((h,n)=>({...h,index:n})).filter(h=>h.state==='cleaning');
        const h=cleaning?.length?cleaning[i%cleaning.length]:null;
        const points=branch.flow?(h?[scene.layout.destinations[`hall${h.index+1}-front`],scene.layout.destinations[`hall${h.index+1}-rear`],scene.layout.destinations[`hall${h.index+1}-front`]]:null):[scene.layout.entrance,scene.layout.destinations.toilets,scene.layout.entrance];
        if(points){const route=scene.nav.through(points),p=sampleRoute(route,(this.animation*.018+i*.2)%1);if(p){({x,y,z,dx,dy}=p);working=true}}
      }
      actors.push({depth:x+y+.3,draw:()=>this.actor(x,y,z,{staff:true,dx,dy,index:person.id,moving:working&&running&&!state.paused})});
    });
    this.stats.walkers=actors.length;return actors.sort((a,b)=>a.depth-b.depth);
  }
  label(text,x,y,{color='#e8d2a3',selected=false}={}){
    const c=this.c;c.font='600 19px "Noto Sans CJK HK","Noto Sans CJK TC",sans-serif';const w=c.measureText(text).width+24;
    c.fillStyle='#10242d';c.fillRect(Math.round(x-w/2),Math.round(y-17),Math.ceil(w),33);c.fillStyle=selected?'#7bc4b5':color;c.fillRect(Math.round(x-w/2),Math.round(y-17),Math.ceil(w),2);c.textAlign='center';c.textBaseline='middle';c.fillText(text,Math.round(x),Math.round(y));
  }
  labels(branch,state){
    for(const r of this.scene.layout.rooms.filter(r=>C.hasRoom(branch,r.id))){const [x,y,w]=r.rect,p=project(x+w/2,y+.25,r.id.startsWith('hall')?5.5:3.1);this.label(r.name+(r.id.startsWith('hall')?` · ${branch.seats[Number(r.id.slice(-1))-1]} 席`:''),p[0],p[1],{selected:this.selected===r.id});}
    const P=project(...this.scene.layout.entrance);this.label('入口／起點',P[0],P[1]+18,{color:'#9dd4bf'});
    for(let h=0;h<2;h++)if(C.hasRoom(branch,`hall${h+1}`)&&hallUnderRepair(branch,state,h)){const r=C.ROOMS.find(r=>r.id===`hall${h+1}`),p=project(r.rect[0]+8,r.rect[1]+8,1.5);this.label('維修中 · 暫停入場',p[0],p[1],{color:'#efb18c'});}
    const q=operationsSnapshot(state,branch.id);if(q){for(const [id,n]of [['tickets',q.tickets],['snacks',q.snacks]])if(n){const r=C.ROOMS.find(r=>r.id===id),p=project(r.rect[0]+4.25,r.rect[1]+6.25);this.label(`等候 ${n} 人`,p[0],p[1]+20,{color:'#e8cb83'})}q.halls.forEach((h,i)=>{if(['cleaning','maintenance'].includes(h.state)){const r=C.ROOMS.find(r=>r.id===`hall${i+1}`),p=project(r.rect[0]+8,r.rect[1]+8,1.5);this.label(h.state==='maintenance'?'保養中 · 影廳停用':'清潔中 · 暫未開放',p[0],p[1],{color:'#e8cb83'})}})}
    if(this.selected){const room=this.scene.layout.rooms.find(r=>r.id===this.selected);if(room){const [x,y,w,h]=room.rect;this.c.fillStyle='#89d6bd';this.c.globalAlpha=.12;this.c.beginPath();[[x,y],[x+w,y],[x+w,y+h],[x,y+h]].map(([a,b])=>project(a,b)).forEach(([a,b],i)=>i?this.c.lineTo(a,b):this.c.moveTo(a,b));this.c.closePath();this.c.fill();this.c.globalAlpha=1;}}
  }
  render(state,delta=0){
    this.state=state;const branch=state.branches.find(b=>b.id===state.activeBranch)||state.branches[0],live=state.phase==='running'&&!state.paused;
    if(live)this.animation+=delta*state.speed;
    this.drawElapsed+=delta;if(delta && this.drawElapsed<(live?1/30:1/12)&&!this.dirty)return;
    const compileStart=performance.now();this.drawElapsed=0;this.dirty=false;this.scene=this.sceneFor(branch);
    this.stats.coldCompileMs=Math.max(this.stats.coldCompileMs||0,Math.round(performance.now()-compileStart));const start=performance.now();
    const c=this.c;c.setTransform(1,0,0,1,0,0);c.imageSmoothingEnabled=false;c.fillStyle='#142630';c.fillRect(0,0,this.canvas.width,this.canvas.height);
    const view=this.view();c.setTransform(view.s,0,0,view.s,view.x,view.y);
    const actors=this.dynamic(branch,state);let cursor=0;
    for(const layer of this.scene.layers){while(cursor<actors.length&&actors[cursor].depth<layer.depth)actors[cursor++].draw();c.drawImage(layer.canvas,layer.x,layer.y);}
    while(cursor<actors.length)actors[cursor++].draw();this.labels(branch,state);c.setTransform(1,0,0,1,0,0);
    this.timings.push(performance.now()-start);if(this.timings.length>180)this.timings.shift();
    this.stats={...this.stats,version:'0.6.0',operations:operationsSnapshot(state,branch.id),mapGrid:[56,56],mapBlocks:[7,7],floorBlocks:this.scene.layout.floorBlocks.length,builtRooms:this.scene.layout.built,roomRects:C.ROOMS.map(r=>({id:r.id,rect:r.rect,door:r.door})),objects:this.scene.props.length,seatCounts:[0,1].map(h=>this.scene.props.filter(p=>p.kind==='seat'&&p.room===`hall${h+1}`).length),layers:this.scene.layers.length,cacheMiB:Math.round(this.scene.estimatedCacheBytes/1024/1024),renderP95Ms:Math.round([...this.timings].sort((a,b)=>a-b)[Math.floor(this.timings.length*.95)]*10)/10,pathsReachable:this.scene.routes.every((p,h)=>!C.hasRoom(branch,`hall${h+1}`)||!C.operational(branch)||p.length>0)};
  }
}

export function drawPoster(canvas,m){
  const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,frame=posterFrames.get(m.id);if(!frame)return;
  c.imageSmoothingEnabled=false;c.drawImage(frame.image,frame.x,frame.y,frame.width,frame.height,0,0,w,h);
  c.fillStyle='#0b1c2d';c.fillRect(0,h*.82,w,h*.18);c.fillStyle='#f5dfb4';c.textAlign='center';c.textBaseline='middle';c.font=`600 ${Math.round(w*.085)}px "Noto Sans CJK TC",sans-serif`;
  if(m.title.length>7){const at=Math.ceil(m.title.length/2);c.fillText(m.title.slice(0,at),w/2,h*.87);c.fillText(m.title.slice(at),w/2,h*.94);}else c.fillText(m.title,w/2,h*.91);
}
