import { movie } from './engine.mjs';
import { createCinemaScene } from './scene.mjs';
import { project, pickRoom, sampleRoute, hallUnderRepair } from './world.mjs';

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
  fit(){this.camera={zoom:1,x:0,y:0};this.dirty=true;}
  view(){const s=Math.min(this.canvas.width/1640,this.canvas.height/1020)*.96*this.camera.zoom;return {s,x:this.canvas.width/2+this.camera.x-880*s,y:this.canvas.height/2+this.camera.y-610*s};}
  pick(x,y){
    if(!this.scene)return;const v=this.view(),room=pickRoom(this.scene.layout,(x-v.x)/v.s,(y-v.y)/v.s);
    if(room){this.selected=room.id;this.dirty=true;this.onSelect(room.id);}
  }
  sceneFor(branch){
    const signature=JSON.stringify([branch.seats,branch.upgrades]),cached=scenes.get(branch.id);
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
  dynamic(branch,state){
    const actors=[],scene=this.scene,shows=this.activeShows(branch,state),running=state.phase==='running'||state.phase==='event';
    for(let h=0;h<2;h++)if(shows[h]){
      const frame=posterFrames.get(shows[h].movie),s=scene.layout.terraces[h].screen;
      if(frame)for(let x=s.x;x<s.x+s.width-.001;x+=.5){
        const length=Math.min(.5,s.x+s.width-x),ratio=length/s.width,left=(x-s.x)/s.width;
        actors.push({depth:x+s.y+.25,draw:()=>{
          const c=this.c,p=project(x,s.y,s.top_m),q=project(x+length,s.y,s.top_m),sourceW=frame.width*ratio,sourceH=frame.width*.52;
          c.save();c.imageSmoothingEnabled=false;c.transform((q[0]-p[0])/sourceW,(q[1]-p[1])/sourceW,0,(s.top_m-s.bottom_m)*32/sourceH,p[0],p[1]);
          c.drawImage(frame.image,frame.x+frame.width*left,frame.y+frame.height*.12,sourceW,sourceH,0,0,sourceW,sourceH);c.restore();
        }});
      }
    }
    if(running){
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
    const jobs={tickets:[[9,22.25],[5.5,22.25],[3.25,25.25]],snacks:[[25.25,21.75],[27.75,22.25],[27.25,24.25]],cleaning:[[6.75,31.25],[16.25,19.75],[21.25,29.25]]};
    for(const role of Object.keys(jobs))branch.staff.filter(p=>p.role===role).slice(0,3).forEach((person,i)=>{
      let [x,y]=jobs[role][i],z=0,dx=0,dy=1;
      if(role==='cleaning'&&running){const route=scene.nav.through([[6.75,31.25],[16.25,19.75],[16.25,29.25]]);const p=sampleRoute(route,(this.animation*.018+i*.2)%1);if(p){({x,y,z,dx,dy}=p);}}
      actors.push({depth:x+y+.3,draw:()=>this.actor(x,y,z,{staff:true,dx,dy,index:person.id,moving:role==='cleaning'&&running&&!state.paused})});
    });
    this.stats.walkers=actors.length;return actors.sort((a,b)=>a.depth-b.depth);
  }
  label(text,x,y,{color='#e8d2a3',selected=false}={}){
    const c=this.c;c.font='600 19px "Noto Sans CJK HK","Noto Sans CJK TC",sans-serif';const w=c.measureText(text).width+24;
    c.fillStyle='#10242d';c.fillRect(Math.round(x-w/2),Math.round(y-17),Math.ceil(w),33);c.fillStyle=selected?'#7bc4b5':color;c.fillRect(Math.round(x-w/2),Math.round(y-17),Math.ceil(w),2);c.textAlign='center';c.textBaseline='middle';c.fillText(text,Math.round(x),Math.round(y));
  }
  labels(branch,state){
    for(const r of this.scene.layout.rooms){const [x,y,w]=r.rect,p=project(x+w/2,y+.25,r.id.startsWith('hall')?5.5:3.1);this.label(r.name+(r.id.startsWith('hall')?` · ${branch.seats[Number(r.id.slice(-1))-1]} 席`:''),p[0],p[1],{selected:this.selected===r.id});}
    const P=project(16,34.5);this.label('入口',P[0],P[1]+12,{color:'#9dd4bf'});
    for(let h=0;h<2;h++)if(hallUnderRepair(branch,state,h)){const p=project(h?25:7,11,1.5);this.label('維修中 · 暫停入場',p[0],p[1],{color:'#efb18c'});}
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
    this.stats={...this.stats,version:'0.3.0',objects:this.scene.props.length,seatCounts:[0,1].map(h=>this.scene.props.filter(p=>p.kind==='seat'&&p.room===`hall${h+1}`).length),layers:this.scene.layers.length,cacheMiB:Math.round(this.scene.estimatedCacheBytes/1024/1024),renderP95Ms:Math.round([...this.timings].sort((a,b)=>a-b)[Math.floor(this.timings.length*.95)]*10)/10,pathsReachable:this.scene.routes.every(p=>p.length>0)};
  }
}

export function drawPoster(canvas,m){
  const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,frame=posterFrames.get(m.id);if(!frame)return;
  c.imageSmoothingEnabled=false;c.drawImage(frame.image,frame.x,frame.y,frame.width,frame.height,0,0,w,h);
  c.fillStyle='#0b1c2d';c.fillRect(0,h*.82,w,h*.18);c.fillStyle='#f5dfb4';c.textAlign='center';c.textBaseline='middle';c.font=`600 ${Math.round(w*.085)}px "Noto Sans CJK TC",sans-serif`;
  if(m.title.length>7){const at=Math.ceil(m.title.length/2);c.fillText(m.title.slice(0,at),w/2,h*.87);c.fillText(m.title.slice(at),w/2,h*.94);}else c.fillText(m.title,w/2,h*.91);
}
