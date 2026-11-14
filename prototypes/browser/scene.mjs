import { WORLD, project, placement, Navigation, customerRoutes, elevation as terrainHeight } from './world.mjs';
import {modularLayout} from './map-world.mjs';
// Static art is cached in tightly bounded depth layers; actors can move between them.
export function createCinemaScene(atlas, images, branch) {
 const layout=modularLayout(branch,atlas.assets),[baseX,baseY,WIDTH,HEIGHT]=layout.bounds,TW=48,TH=24,OX=900,OY=270,ZM=32;
 const canvas=document.createElement('canvas');canvas.width=WIDTH;canvas.height=HEIGHT;
 let ctx=canvas.getContext('2d'),offsetX=baseX,offsetY=baseY;ctx.translate(-baseX,-baseY);
 const C={ink:'#162631',edge:'#11212b',cream:'#ded0af',gold:'#c8a363',goldLight:'#f0d8a1',navy:'#263f4b',teal:'#385a60',burgundy:'#732d45'};
 const ip=(x,y,z=0)=>project(x,y,z/ZM).map(Math.round);
 const rectPoints=([x,y,w,h],z=0)=>[ip(x,y,z),ip(x+w,y,z),ip(x+w,y+h,z),ip(x,y+h,z)];
 function pixels(image){const c=document.createElement('canvas');c.width=image.width||1254;c.height=image.height||1254;const p=c.getContext('2d');p.drawImage(image,0,0);return p.getImageData(0,0,c.width,c.height).data;}
 const materials=images.floors,materialSize=materials.width||1254,materialPixels=pixels(materials),wallTexture=images.walls,wallSize=wallTexture.width||1254,wallPixels=pixels(wallTexture);
 function bounds(points,pad=0){return [Math.floor(Math.min(...points.map(p=>p[0])))-pad,Math.floor(Math.min(...points.map(p=>p[1])))-pad,Math.ceil(Math.max(...points.map(p=>p[0])))+pad,Math.ceil(Math.max(...points.map(p=>p[1])))+pad];}
function px(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));}
function line(a,b,color,width=1){
 let [x,y]=a.map(Math.round),[X,Y]=b.map(Math.round),dx=Math.abs(X-x),sx=x<X?1:-1,dy=-Math.abs(Y-y),sy=y<Y?1:-1,err=dx+dy;
 while(true){px(x,y,width,width,color);if(x===X&&y===Y)break;const e=2*err;if(e>=dy){err+=dy;x+=sx;}if(e<=dx){err+=dx;y+=sy;}}
}
// Scanline polygons keep 2:1 edges on the native pixel grid without anti-aliasing.
function poly(points,color){
 const low=Math.min(...points.map(p=>p[1])),high=Math.max(...points.map(p=>p[1]));ctx.fillStyle=color;
 for(let y=Math.ceil(low);y<high;y++){
  const hits=[];for(let i=0,j=points.length-1;i<points.length;j=i++){
   const a=points[i],b=points[j];if((a[1]<=y+.5&&b[1]>y+.5)||(b[1]<=y+.5&&a[1]>y+.5))hits.push(a[0]+(y+.5-a[1])*(b[0]-a[0])/(b[1]-a[1]));
  }hits.sort((a,b)=>a-b);for(let i=0;i+1<hits.length;i+=2)ctx.fillRect(Math.ceil(hits[i]),y,Math.max(1,Math.ceil(hits[i+1])-Math.ceil(hits[i])),1);
 }
}
function border(points,color,width=1){points.forEach((p,i)=>line(p,points[(i+1)%points.length],color,width));}
function inside(x,y,r){return x>=r[0]&&x<r[0]+r[2]&&y>=r[1]&&y<r[1]+r[3];}
function roomAt(x,y){return layout.rooms.find(r=>inside(x,y,r.rect));}
function text(s,x,y,size=13,color=C.cream,align='left'){ctx.font=`600 ${size}px "Noto Sans CJK TC",sans-serif`;ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(s,Math.round(x),Math.round(y));}
function plaque(s,x,y,{accent=C.gold,size=13,align='center'}={}){
 ctx.font=`600 ${size}px "Noto Sans CJK TC",sans-serif`;const w=Math.ceil(ctx.measureText(s).width)+22,h=size+14,L=Math.round(align==='left'?x:x-w/2),T=Math.round(y-h/2);
 px(L+3,T+3,w,h,'#0e1925');px(L,T,w,h,C.ink);px(L,T,w,2,accent);px(L,T,2,h,accent);text(s,L+w/2,T+h/2,size,C.cream,'center');
}
function floor(){
 if(layout.modular){
  const q=Math.floor(materialSize/2);
  for(const block of layout.floorBlocks){const [a,b]=block.split(',').map(n=>Number(n)*8);ctx.save();ctx.setTransform(24,12,-24,12,OX-offsetX,OY-offsetY);ctx.beginPath();ctx.rect(a,b,8,8);ctx.clip();for(let x=a;x<a+8;x+=4)for(let y=b;y<b+8;y+=4)ctx.drawImage(materials,0,0,q,q,x,y,4,4);ctx.restore()}
  return;
 }
 // Render flat material samples directly to the isometric plane; this never edits the source PNG.
 const output=ctx.createImageData(WIDTH,HEIGHT),dst=output.data,src=materialPixels;
 const q=Math.floor(materialSize/2),materialOf={hall1:1,hall2:2,toilets:3,staff:3};
 for(let py=OY;py<OY+TH/2*(32+34);py++)for(let px_=OX-34*TW/2;px_<OX+32*TW/2;px_++){
  const u=(px_+.5-OX)/(TW/2),v=(py+.5-OY)/(TH/2),x=(u+v)/2,y=(v-u)/2;
  if(x<0||y<0||x>=32||y>=34)continue;
  const r=roomAt(x,y),m=materialOf[r?.id]??0,col=m%2,row=Math.floor(m/2);
  const tx=col*q+Math.floor(((x%6)/6)*(q-2))+1,ty=row*q+Math.floor(((y%6)/6)*(q-2))+1;
  const si=(ty*materialSize+tx)*4,di=(py*WIDTH+px_)*4;
  dst[di]=src[si];dst[di+1]=src[si+1];dst[di+2]=src[si+2];dst[di+3]=255;
 }
 ctx.putImageData(output,0,0);
}
function floorTrim(){
 if(layout.modular){for(let y=0;y<7;y++)for(let x=0;x<7;x++){const owned=layout.floorBlocks.includes(`${x},${y}`);border(rectPoints([x*8,y*8,8,8]),owned?'#9e8b60':'#29434c')}return;}
 for(const r of layout.rooms.filter(r=>!r.id.startsWith('hall'))) {const [x,y,w,h]=r.rect;border(rectPoints([x+.15,y+.15,w-.3,h-.3]),'#a88d61');}
 const p=rectPoints([14.5,32.25,3,1.5]);poly(p,'#30494b');border(p,C.gold);
 poly([ip(16,32.6),ip(16.6,33),ip(16,33.4),ip(15.4,33)],C.gold);
}
function elevation(x,y){
 if(layout.modular)return terrainHeight(layout,x,y);
 const hall=layout.terraces.find(t=>{const r=layout.rooms.find(r=>r.id===t.room);return inside(x,y,r.rect)});
 if(!hall||y<6.5)return 0;
 if(y>=16.5)return 2.1;
 const row=Math.max(0,Math.min(7,Math.floor((y-6.5)/1.25)));
 if(x>hall.aisle_x[0]&&x<hall.aisle_x[1]&&row>0){const f=(y-6.5)/1.25-row;return (row-1)*.3+(f<.5?.15:.3);}
 return row*.3;
}
function panel(p,q,top,base,quadrant=0,offset=0){
 const h=top-base;if(h<=0)return;
 const n=Math.floor(wallTexture.width/2),col=quadrant%2,row=Math.floor(quadrant/2),sample=128;
 const sx=col*n+((offset*sample)%(n-sample)),sy=row*n;
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.setTransform((q[0]-p[0])/sample,(q[1]-p[1])/sample,0,h/n,p[0]-offsetX,p[1]-top-offsetY);
 ctx.drawImage(wallTexture,sx,sy,sample,n,0,0,sample,n);ctx.restore();
}
function wallSegment(w,a,b){
 const r=layout.rooms.find(r=>r.id===w.room),hall=r?.id.startsWith('hall');
 const facesCore=w.axis==='v'&&[14,18].includes(w.line)&&r;
 const rear=!facesCore&&(w.axis==='h'?(r?w.line===r.rect[1]:w.line===0):(r?w.line===r.rect[0]:w.line===0));
 const xx=w.axis==='h'?(a+b)/2:w.line+(r&&w.line===r.rect[0]?.01:-.01),yy=w.axis==='h'?w.line+(r&&w.line===r.rect[1]?.01:-.01):(a+b)/2;
 const floor=hall?elevation(xx,yy)*ZM:0;
 const height=rear?(hall?5.2*ZM:3*ZM):(hall?floor+.35*ZM:10);
 const p=w.axis==='h'?ip(a,w.line):ip(w.line,a),q=w.axis==='h'?ip(b,w.line):ip(w.line,b);
 if(hall)panel(p,q,height,0,rear?0:1,Math.floor(a));else poly([p,q,[q[0],q[1]-height],[p[0],p[1]-height]],w.axis==='h'?'#38505a':'#2d444e');
 line(p,q,C.edge,2);line([p[0],p[1]-height],[q[0],q[1]-height],C.goldLight,2);
 poly([[p[0],p[1]-height],[q[0],q[1]-height],[q[0]+4,q[1]-height-3],[p[0]+4,p[1]-height-3]],'#c3b590');
 if(rear){
  line([p[0],p[1]-8],[q[0],q[1]-8],C.gold);
  for(const z of hall?[48,100,148]:[30,60])if(z<height)line([p[0],p[1]-z],[q[0],q[1]-z],hall?'#2e4653':'#527079');
  line([p[0],p[1]-height+4],[p[0],p[1]-9],hall?'#122431':'#46626a');
 }
 if(hall&&w.axis==='h'&&w.line===r.rect[1])screenFragment(r,a,b);
}
function screenFragment(r,a,b){
 const t=layout.terraces.find(t=>t.room===r.id),s=t.screen,top=s.top_m*ZM,base=s.bottom_m*ZM;
 for(const [u,v] of [[r.rect[0]+.4,s.x-.15],[s.x+s.width+.15,r.rect[0]+r.rect[2]-.4]]){
  const A=Math.max(a,u),B=Math.min(b,v);if(A<B)panel(ip(A,s.y),ip(B,s.y),top+8,0,2,Math.floor(A));
 }
 const A=Math.max(a,s.x),B=Math.min(b,s.x+s.width);if(A>=B)return;
 const p=ip(A,s.y),q=ip(B,s.y);
 poly([[p[0],p[1]-top],[q[0],q[1]-top],[q[0],q[1]-base],[p[0],p[1]-base]],'#e7e6cb');
 line([p[0],p[1]-top],[q[0],q[1]-top],'#fff3ce',2);line([p[0],p[1]-base],[q[0],q[1]-base],C.gold,2);
 if(A===s.x)line([p[0],p[1]-top],[p[0],p[1]-base],C.gold,2);
 if(B===s.x+s.width)line([q[0],q[1]-top],[q[0],q[1]-base],C.gold,2);
 for(let z=base+4;z<top;z+=4)line([p[0],p[1]-z],[q[0],q[1]-z],'#d9e0ce');
}
function door(d){
 const a=d.axis==='h'?ip(d.a,d.line):ip(d.line,d.a),b=d.axis==='h'?ip(d.b,d.line):ip(d.line,d.b);
 line(a,b,'#5b4c3b',3);line([a[0],a[1]-2],[b[0],b[1]-2],C.goldLight);
 for(const p of [a,b]){px(p[0]-1,p[1]-12,3,12,C.gold);px(p[0]-2,p[1]-13,5,3,C.cream);}
 if(d.room.startsWith('hall')){
  const height=2.4*ZM;
  for(const p of [a,b]){px(p[0]-3,p[1]-height,6,height,'#25424d');px(p[0]-1,p[1]-height,1,height,C.gold);}
  line([a[0],a[1]-height],[b[0],b[1]-height],'#23434a',5);line([a[0],a[1]-height-1],[b[0],b[1]-height-1],C.gold,1);
  const p=d.axis==='h'?ip(d.a-.35,d.line,18):ip(d.line,d.a-.35,18);px(p[0]-9,p[1]-7,18,14,'#234b4c');text(d.room==='hall1'?'01':'02',p[0],p[1],9,'#bce0ca','center');
 }
}
function sprite(o){
 const g=placement(o,atlas.assets),[sx,sy,sw,sh]=g.spec.region,m=g.matrix;
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.setTransform(m[0],m[1],m[2],m[3],m[4]-offsetX,m[5]-offsetY);ctx.drawImage(images.props,sx,sy,sw,sh,0,0,sw,sh);ctx.restore();
}
function rails(){
 for(const q of layout.queues){const [x,y,X,Y]=q.rail;
  for(let t=0;t<1;t+=.04){const tt=Math.min(1,t+.04),a=ip(x+(X-x)*t,y+(Y-y)*t,12),b=ip(x+(X-x)*tt,y+(Y-y)*tt,12);line(a,b,C.burgundy,2);}
  for(const t of [0,.5,1]){const p=ip(x+(X-x)*t,y+(Y-y)*t);poly([[p[0]-4,p[1]],[p[0],p[1]-2],[p[0]+4,p[1]],[p[0],p[1]+2]],'#8b744c');px(p[0]-1,p[1]-20,2,20,C.gold);px(p[0]-2,p[1]-22,4,4,C.goldLight);}
 }
}
function surface(rect,z,material){
 const corners=rectPoints(rect,z),left=Math.max(0,Math.min(...corners.map(p=>p[0]))),top=Math.max(0,Math.min(...corners.map(p=>p[1]))),right=Math.min(WIDTH,Math.max(...corners.map(p=>p[0]))+1),bottom=Math.min(HEIGHT,Math.max(...corners.map(p=>p[1]))+1);
 const w=right-left,h=bottom-top,off=document.createElement('canvas');off.width=w;off.height=h;const c=off.getContext('2d'),out=c.createImageData(w,h),dest=out.data;
 const size=material===4?wallSize:materialSize,source=material===4?wallPixels:materialPixels,q=Math.floor(size/2),m=material===4?3:material;
 for(let j=0;j<h;j++)for(let i=0;i<w;i++){
  const u=(left+i+.5-OX)/(TW/2),v=(top+j+.5-OY+z)/(TH/2),x=(u+v)/2,y=(v-u)/2;if(!inside(x,y,rect))continue;
  const tx=(m%2)*q+Math.floor((x%6)/6*(q-2))+1,ty=Math.floor(m/2)*q+Math.floor((y%6)/6*(q-2))+1,si=(ty*size+tx)*4,di=(j*w+i)*4;
  dest[di]=source[si];dest[di+1]=source[si+1];dest[di+2]=source[si+2];dest[di+3]=255;
 }
 c.putImageData(out,0,0);ctx.drawImage(off,left,top);
}
function platform(rect,meters,material,{led=false,stage=false}={}){
 const z=meters*ZM,[x,y,w,h]=rect,front=ip(x,y+h),right=ip(x+w,y),corner=ip(x+w,y+h);
 if(z>0){
  panel(right,corner,z,0,1,Math.floor(y));panel(corner,front,z,0,1,Math.floor(x));
  line([front[0],front[1]-z],[corner[0],corner[1]-z],stage?C.gold:'#4e5861');
 }
 surface(rect,z,material);
 if(led)line(ip(x,y,z),ip(x+w,y,z),'#e4bd70');
}
function addTerraceGeometry(items){
 function chunks(rect,meters,material,led=false){
  const [X,Y,W,H]=rect;
  for(let x=X;x<X+W-1e-7;x+=1)for(let y=Y;y<Y+H-1e-7;y+=.625){
   const w=Math.min(1,X+W-x),h=Math.min(.625,Y+H-y),r=[x,y,w,h];
   items.push({depth:x+y+(w+h)/2+.05,bounds:bounds(rectPoints(r).concat(rectPoints(r,meters*ZM)),8),draw:()=>platform(r,meters,material,{led:led&&y===Y})});
  }
 }
 for(const t of layout.terraces){
  const r=layout.rooms.find(r=>r.id===t.room),[x,y,w,h]=r.rect,material=t.room==='hall1'?1:2,[a,b]=t.aisle_x;
  items.push({depth:t.stage.rect[0]+t.stage.rect[1]+(t.stage.rect[2]+t.stage.rect[3])/2,bounds:bounds(rectPoints(t.stage.rect).concat(rectPoints(t.stage.rect,.35*ZM)),6),draw:()=>platform(t.stage.rect,.35,1,{stage:true})});
  for(const tier of t.tiers){
   const y=tier.front_y,d=tier.back_y-y;
   chunks([x,y,a-x,d],tier.elevation_m,material);
   chunks([b,y,x+w-b,d],tier.elevation_m,material);
   const row=tier.row-1;
   for(let s=0;s<2;s++){
    const level=row===0?0:(row-1)*.3+(s+1)*.15;
    chunks([a,y+s*d/2,b-a,d/2],level,4,true);
   }
  }
  chunks(t.rear_walkway,2.1,material);
 }
}
function stairRails(terraces=layout.terraces){
 for(const t of terraces){
  for(const x of [t.aisle_x[0]+.08,t.aisle_x[1]-.08]){
   const first=t.tiers[0].front_y,ys=[first,first+2.5,first+5,first+7.5,t.rear_walkway[1]],points=[];
   for(const y of ys){const z=elevation(x,y)*ZM,P=ip(x,y,z),Q=ip(x,y,z+.75*ZM);line(P,Q,'#87978e',2);points.push(Q);}
   for(let i=0;i+1<points.length;i++)line(points[i],points[i+1],'#e4d6ad',2);
  }
 }
}

 function zoneMatrix(r){const spec=atlas.zoneSprites[r.id],[x,y,w,h]=r.rect,A=project(x,y),B=project(x+w,y),D=project(x,y+h),[sx,sy]=spec.origin,ux=spec.right[0]-sx,uy=spec.right[1]-sy,vx=spec.left[0]-sx,vy=spec.left[1]-sy,det=ux*vy-vx*uy,bx=B[0]-A[0],by=B[1]-A[1],dx=D[0]-A[0],dy=D[1]-A[1];const a=(bx*vy-dx*uy)/det,b=(by*vy-dy*uy)/det,c=(-bx*vx+dx*ux)/det,d=(-by*vx+dy*ux)/det;return [a,b,c,d,A[0]-a*sx-c*sy,A[1]-b*sx-d*sy]}
 function zoneImage(r,mask=null){const spec=atlas.zoneSprites[r.id],im=images[spec.image],m=zoneMatrix(r);const clip=mask===true?spec.foreground:mask;
  ctx.save();ctx.imageSmoothingEnabled=false;ctx.setTransform(m[0],m[1],m[2],m[3],m[4]-offsetX,m[5]-offsetY);for(const polygon of [spec.outline,...(clip?[clip]:[])]){ctx.beginPath();polygon.forEach(([u,v],i)=>i?ctx.lineTo(u,v):ctx.moveTo(u,v));ctx.closePath();ctx.clip()}ctx.drawImage(im,0,0);ctx.restore();
 }
 const objects=layout.objects,props=objects.map(o=>placement(o,atlas.assets));
 const nav=new Navigation(layout,objects,atlas.assets),routes=customerRoutes(layout,nav);
 ctx.imageSmoothingEnabled=false;floor();floorTrim();
 const items=[];addTerraceGeometry(items);
 for(const w of layout.walls.filter(w=>w.room.startsWith('hall')))for(let a=w.a;a<w.b;a+=.5){
  const b=Math.min(a+.5,w.b),p=w.axis==='h'?ip(a,w.line):ip(w.line,a),q=w.axis==='h'?ip(b,w.line):ip(w.line,b);
  items.push({depth:w.line+(a+b)/2,bounds:bounds([p,q,[p[0],p[1]-180],[q[0],q[1]-180]],10),draw:()=>wallSegment(w,a,b)});
 }
 for(const o of objects){const g=props.find(p=>p.id===o.id);items.push({depth:g.depth,bounds:g.bounds.map((n,i)=>n+(i<2?-4:4)),draw:()=>sprite(o)});}
 for(const r of layout.zoneObjects){const [x,y,w,h]=r.rect,box=bounds([...rectPoints(r.rect),...rectPoints(r.rect,3.6*ZM)],10),spec=atlas.zoneSprites[r.id];items.push({depth:x+y+(r.id==='toilets'?8.3:-.1),bounds:box,draw:()=>zoneImage(r)});if(spec.foreground){
  // Rear architecture is restored in depth strips; staff remain between the fitted backbar and counter front.
  const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t),m=zoneMatrix(r);
  for(const side of ['right','left'])for(let i=0;i<16;i++){const top=side==='right'?spec.outline[1]:spec.outline[5],bottom=spec[side],pad=side==='right'?[-100,55]:[100,55],a=mix(spec.outline[0],top,i/16),b=mix(spec.outline[0],top,(i+1)/16),c=mix(spec.origin,bottom,(i+1)/16).map((v,j)=>v+pad[j]),d=mix(spec.origin,bottom,i/16).map((v,j)=>v+pad[j]),mask=[a,b,c,d],points=mask.map(([u,v])=>[m[0]*u+m[2]*v+m[4],m[1]*u+m[3]*v+m[5]]);items.push({depth:x+y+(i+.5)/2+.2,bounds:bounds(points,3),draw:()=>zoneImage(r,mask)})}
  items.push({depth:x+y+8.4,bounds:box,draw:()=>zoneImage(r,true)})
 }}
 for(const d of layout.doors){const p=d.axis==='h'?ip(d.a,d.line):ip(d.line,d.a),q=d.axis==='h'?ip(d.b,d.line):ip(d.line,d.b);items.push({depth:d.line+(d.a+d.b)/2+.5,bounds:bounds([p,q,[p[0],p[1]-95],[q[0],q[1]-95]],18),draw:()=>door(d)});}
 const railPoints=layout.queues.flatMap(q=>{const [x,y,X,Y]=q.rail;return [ip(x,y),ip(X,Y),ip(x,y,24),ip(X,Y,24)];});
 if(railPoints.length)items.push({depth:65,bounds:bounds(railPoints,8),draw:rails});
 for(const t of layout.terraces){const stairPoints=t.aisle_x.flatMap(x=>[ip(x,t.tiers[0].front_y,24),ip(x,t.rear_walkway[1],100),ip(x,t.rear_walkway[1])]);items.push({depth:t.aisle_x[1]+t.rear_walkway[1]+.1,bounds:bounds(stairPoints,10),draw:()=>stairRails([t])})}
 const bands=new Map();for(const item of items){const n=Math.floor(item.depth);if(!bands.has(n))bands.set(n,[]);bands.get(n).push(item);}
 const layers=[{depth:-100,canvas,x:baseX,y:baseY}],baseContext=ctx;
 for(const [depth,group]of [...bands].sort((a,b)=>a[0]-b[0])){
  const box=bounds(group.flatMap(i=>[[i.bounds[0],i.bounds[1]],[i.bounds[2],i.bounds[3]]]),3),[L,T,R,B]=box;
  const image=document.createElement('canvas');image.width=R-L;image.height=B-T;ctx=image.getContext('2d');offsetX=L;offsetY=T;ctx.imageSmoothingEnabled=false;ctx.translate(-L,-T);
  group.sort((a,b)=>a.depth-b.depth).forEach(i=>i.draw());layers.push({depth,canvas:image,x:L,y:T});
 }
 ctx=baseContext;offsetX=0;offsetY=0;
 return {layout,objects,props,nav,routes,layers,estimatedCacheBytes:layers.reduce((n,l)=>n+l.canvas.width*l.canvas.height*4,0),project,world:WORLD};
}
