// Map gestures promoted from the approved touch review. CSS-pixel camera adapter; no simulation/storage effects.
export function createMapTouch(surface,{camera,write,onTap,onPress=()=>{},reducedMotion=false}){
 const pointers=new Map();let mode=null,start=null,dragged=false,pinched=false,velocity={x:0,y:0},frame=0,lastTap=null,alive=true;
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const bounded=c=>({zoom:clamp(c.zoom,.7,2.4),x:clamp(c.x,-surface.clientWidth*.65,surface.clientWidth*.65),y:clamp(c.y,-surface.clientHeight*.65,surface.clientHeight*.65)});
 function stop(){if(frame&&typeof cancelAnimationFrame==='function')cancelAnimationFrame(frame);frame=0}
 function pair(){const [a,b]=[...pointers.values()];return {x:(a.x+b.x)/2,y:(a.y+b.y)/2,d:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y))}}
 function anchorZoom(c,z,point){const r=surface.getBoundingClientRect(),ox=point.x-r.left-r.width/2,oy=point.y-r.top-r.height/2,k=z/c.zoom;return bounded({zoom:z,x:ox-(ox-c.x)*k,y:oy-(oy-c.y)*k})}
 function down(e){if(e.button!==0||e.target.closest('[data-map-controls]'))return;stop();e.preventDefault();pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});surface.setPointerCapture(e.pointerId);
  if(pointers.size===1){mode='pan';dragged=false;pinched=false;velocity={x:0,y:0};start={x:e.clientX,y:e.clientY,c:camera(),target:e.target,lastX:e.clientX,lastY:e.clientY,t:e.timeStamp};onPress({x:e.clientX,y:e.clientY});}
  else if(pointers.size===2){mode='pinch';pinched=true;dragged=true;start={...pair(),c:camera()};}
 }
 function move(e){if(!pointers.has(e.pointerId))return;e.preventDefault();pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(mode==='pinch'&&pointers.size>=2){const p=pair(),z=clamp(start.c.zoom*p.d/start.d,.7,2.4),c=anchorZoom(start.c,z,start);c.x+=p.x-start.x;c.y+=p.y-start.y;write(bounded(c));return;}
  if(mode!=='pan'||!start)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;if(Math.hypot(dx,dy)>8)dragged=true;
  if(dragged){const dt=Math.max(8,e.timeStamp-start.t);velocity={x:(e.clientX-start.lastX)/dt,y:(e.clientY-start.lastY)/dt};write(bounded({zoom:start.c.zoom,x:start.c.x+dx,y:start.c.y+dy}));}
  start.lastX=e.clientX;start.lastY=e.clientY;start.t=e.timeStamp;
 }
 function coast(){if(reducedMotion||Math.hypot(velocity.x,velocity.y)<.08)return;let prev=performance.now();const tick=t=>{if(!alive||!surface.isConnected)return;const dt=Math.min(32,t-prev);prev=t;const decay=Math.exp(-dt/115);velocity.x*=decay;velocity.y*=decay;const c=camera();const next=bounded({zoom:c.zoom,x:c.x+velocity.x*dt,y:c.y+velocity.y*dt});if(next.x===c.x)velocity.x=0;if(next.y===c.y)velocity.y=0;write(next);if(Math.hypot(velocity.x,velocity.y)>.018)frame=requestAnimationFrame(tick)};frame=requestAnimationFrame(tick)}
 function up(e){if(!pointers.has(e.pointerId))return;e.preventDefault();pointers.delete(e.pointerId);if(surface.hasPointerCapture(e.pointerId))surface.releasePointerCapture(e.pointerId);
  if(pointers.size===1){const [id,p]=[...pointers.entries()][0];mode='pan';start={...p,c:camera(),target:null,lastX:p.x,lastY:p.y,t:e.timeStamp};dragged=true;pinched=true;velocity={x:0,y:0};return;}
  if(pointers.size)return;
  if(!dragged&&!pinched){const point={x:e.clientX,y:e.clientY,target:start?.target},now=performance.now();if(lastTap&&now-lastTap.t<300&&Math.hypot(point.x-lastTap.x,point.y-lastTap.y)<28){write(anchorZoom(camera(),camera().zoom>1.35?1:1.7,point));lastTap=null}else{lastTap={...point,t:now};onTap(point)}}
  else if(!pinched){if(e.timeStamp-start.t>80)velocity={x:0,y:0};coast();}mode=null;start=null;
 }
 function cancel(){pointers.clear();mode=null;start=null;dragged=true;velocity={x:0,y:0};stop()}
 surface.addEventListener('pointerdown',down);surface.addEventListener('pointermove',move);surface.addEventListener('pointerup',up);surface.addEventListener('pointercancel',cancel);surface.addEventListener('lostpointercapture',e=>{if(pointers.has(e.pointerId))cancel()});
 surface.addEventListener('click',blockClick,true);function blockClick(e){if(e.detail!==0&&!e.target.closest('[data-map-controls]')){e.preventDefault();e.stopPropagation()}}
 return {cancel,destroy(){alive=false;cancel();surface.removeEventListener('pointerdown',down);surface.removeEventListener('pointermove',move);surface.removeEventListener('pointerup',up);surface.removeEventListener('pointercancel',cancel);surface.removeEventListener('click',blockClick,true)}};
}
