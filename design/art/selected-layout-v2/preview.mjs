import {placement} from '../../../prototypes/browser/world.mjs';
const layout=await (await fetch('./layout.json')).json();
const manifest=await (await fetch('../../../src/assets/cinema/runtime/manifest.json')).json();
const image=async path=>{const i=new Image;i.src=path;await i.decode();return i};
const [props,floors,walls,posters,tickets,snacks,toilets]=await Promise.all([
 ...['props-v3.png','floors-v3.png','walls-v3.png','posters-v3.png'].map(f=>image('../../../src/assets/cinema/runtime/'+f)),
 ...['tickets','snacks','toilets'].map(f=>image('../integrated-zones-v2/'+f+'.png'))
]);
const zoneSpecs={
 tickets:{image:tickets,origin:[768,395],right:[1345,684],left:[191,684],outline:[[768,60],[1363,380],[1363,684],[768,992],[171,684],[171,380]]},
 snacks:{image:snacks,origin:[768,395],right:[1338,685],left:[198,685],outline:[[768,60],[1339,393],[1339,685],[768,997],[196,685],[196,394]]},
 toilets:{image:toilets,origin:[794,361],right:[1344,663],left:[244,663],outline:[[794,43],[1344,340],[1344,668],[794,970],[239,668],[239,340]]}
};
const canvas=document.querySelector('#map'),ctx=canvas.getContext('2d'),plan=document.querySelector('#plan'),pc=plan.getContext('2d');
canvas.height=1800;
let ownedCount=49,zoom=false,wcDirection=layout.rooms.find(r=>r.id==='toilets').sourceDoor;
const wc=layout.rooms.find(r=>r.id==='toilets');
function setWcDirection(direction){wcDirection=direction;const [x,y,w,h]=wc.rect;wc.entry=direction==='east'?[x+w,y+h/2]:direction==='west'?[x,y+h/2]:[x+w/2,y+h];wc.entrySide=direction==='east'?'right':direction==='west'?'left':'front'}
const P=(x,y,z=0)=>[1600+(x-y)*24,270+(x+y)*12-z*32];
const rect=([x,y,w,h],z=0)=>[P(x,y,z),P(x+w,y,z),P(x+w,y+h,z),P(x,y+h,z)];
function path(points,c=ctx){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath()}
function poly(points,color){ctx.fillStyle=color;path(points);ctx.fill()}
function line(a,b,color,width=2,dash=[]){ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([])}
function outline(r,color,width=2,dash=[]){const p=rect(r);for(let n=0;n<4;n++)line(p[n],p[(n+1)%4],color,width,dash)}
function plaque(text,x,y,{color='#ebd6a8',size=27}={}){ctx.font=`600 ${size}px system-ui,"Noto Sans CJK TC",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';const w=ctx.measureText(text).width+26;ctx.fillStyle='#102630';ctx.fillRect(x-w/2,y-22,w,44);ctx.fillStyle=color;ctx.fillRect(x-w/2,y-22,w,2);ctx.fillText(text,x,y+1)}
function floor(r,material=0,z=0){
 const [x,y,w,h]=r,q=Math.floor(floors.width/2),sx=(material%2)*q,sy=Math.floor(material/2)*q;
 ctx.save();ctx.setTransform(24,12,-24,12,1600,270-z*32);ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
 for(let a=x;a<x+w;a+=4)for(let b=y;b<y+h;b+=4)ctx.drawImage(floors,sx,sy,q,q,a,b,4,4);
 ctx.restore();
}
function platform(r,z,material){
 const p=rect(r),top=rect(r,z);poly([p[1],p[2],top[2],top[1]],'#31464d');poly([p[2],p[3],top[3],top[2]],'#40545b');floor(r,material,z);
 line(top[3],top[2],'#9b845d',1);
}
function wall(a,b,h){
 const A=P(...a),B=P(...b),T=P(...a,h),U=P(...b,h),q=Math.floor(walls.width/2);
 ctx.save();path([A,B,U,T]);ctx.clip();ctx.setTransform((B[0]-A[0])/q,(B[1]-A[1])/q,0,h*32/q,A[0],T[1]);ctx.drawImage(walls,0,0,q,q,0,0,q,q);ctx.restore();
 line(T,U,'#e4cea2',3);line(A,B,'#bda36e',2);
}
function door(room){
 const [x,y]=room.entry,side=room.entrySide,dx=side==='front'?1.25:0,dy=side==='front'?0:1.25;
 const a=P(x-dx,y-dy),b=P(x+dx,y+dy),A=P(x-dx,y-dy,2.5),B=P(x+dx,y+dy,2.5);
 poly([a,b,B,A],'#162f38');line(a,A,'#c8b17d',3);line(b,B,'#c8b17d',3);line(A,B,'#d4bf91',3);
 const m=P(x,y,2.7);plaque('入口',m[0],m[1],{color:'#a2d8bd',size:18});
}
function hall(room){
 const [X,Y,W,H]=room.rect,material=room.id==='hall1'?1:2;
 floor(room.rect,material);wall([X,Y],[X+W,Y],5.2);wall([X,Y],[X,Y+H],5.2);
 platform([X+1,Y+.8,W-2,2],.35,material);
 const s=P(X+2,Y+.15,4.3),e=P(X+W-2,Y+.15,4.3),screenW=e[0]-s[0],sourceW=posters.width/4,sourceH=sourceW*.56;
 ctx.save();ctx.setTransform(screenW/sourceW,(e[1]-s[1])/sourceW,0,3.3*32/sourceH,s[0],s[1]);ctx.drawImage(posters,room.id==='hall1'?0:sourceW,25,sourceW,sourceH,0,0,sourceW,sourceH);ctx.restore();
 line(P(X+2,Y+.15,1),P(X+W-2,Y+.15,1),'#d6b77b',3);
 for(let row=0;row<8;row++){
  const y=Y+4.5+row*1.25,z=row*.3;
  platform([X,y,7.25,1.25],z,material);platform([X+8.75,y,7.25,1.25],z,material);
  for(let s=0;s<2;s++)platform([X+7.25,y+s*.625,1.5,.625],row===0?0:(row-1)*.3+(s+1)*.15,material);
 }
 platform([X,Y+14.5,16,1.5],2.1,material);
 const chairs=[],columns=room.seats===48?[2,3.7,5.4,10.3,12,13.7]:[2.8,4.6,10.1,11.9,13.7];
 for(let row=0;row<8;row++)for(const x of columns)chairs.push({id:'preview-seat',kind:'seat',rect:[X+x-.45,Y+5.05+row*1.25-.4,.9,.8],elevation_m:row*.3});
 chairs.sort((a,b)=>a.rect[0]+a.rect[1]-b.rect[0]-b.rect[1]).forEach(o=>{const g=placement(o,manifest.assets),m=g.matrix,[sx,sy,w,h]=g.spec.region;ctx.save();ctx.setTransform(m[0],m[1],m[2],m[3],m[4]+700,m[5]);ctx.drawImage(props,sx,sy,w,h,0,0,w,h);ctx.restore()});
 for(const x of [X+7.25,X+8.75]){let last;for(let row=0;row<8;row+=2){const y=Y+5.1+row*1.25,z=row*.3,a=P(x,y,z),b=P(x,y,z+.75);line(a,b,'#a9bbb1',2);if(last)line(last,b,'#d6c6a1',2);last=b}}
 // Near walls are cut away in the design view; the rear high platform remains visible.
 outline(room.rect,'#b09a71',2);door(room);
 const t=P(X+8,Y+1,5.5);plaque(`${room.name} · ${room.seats} 席`,t[0],t[1]);
}
function zone(room){
 const spec=zoneSpecs[room.id],[x,y,w,h]=room.rect,A=P(x,y),B=P(x+w,y),D=P(x,y+h),[sx,sy]=spec.origin;
 const ux=spec.right[0]-sx,uy=spec.right[1]-sy,vx=spec.left[0]-sx,vy=spec.left[1]-sy,det=ux*vy-vx*uy;
 const bx=B[0]-A[0],by=B[1]-A[1],dx=D[0]-A[0],dy=D[1]-A[1];
 const a=(bx*vy-dx*uy)/det,b=(by*vy-dy*uy)/det,c=(-bx*vx+dx*ux)/det,d=(-by*vx+dy*ux)/det;
 ctx.save();ctx.setTransform(a,b,c,d,A[0]-a*sx-c*sy,A[1]-b*sx-d*sy);path(spec.outline);ctx.clip();ctx.drawImage(spec.image,0,0);ctx.restore();
}
function ownedSet(){return new Set(layout.purchaseOrder.slice(0,ownedCount).map(p=>p.join(',')))}
function activeRooms(){const owned=ownedSet();return layout.rooms.filter(r=>r.blocks.every(b=>owned.has(b.join(','))))}
function externalPoint(r){const p=r.entry.slice();if(r.entrySide==='front')p[1]+=.25;else if(r.entrySide==='back')p[1]-=.25;else p[0]+=r.entrySide==='left'?-.25:.25;return p}
function entryBlocker(r){const p=externalPoint(r);return layout.rooms.find(a=>a.id!==r.id&&p[0]>=a.rect[0]&&p[0]<a.rect[0]+a.rect[2]&&p[1]>=a.rect[1]&&p[1]<a.rect[1]+a.rect[3])}
function entryIssue(r){const p=externalPoint(r);if(p[0]<0||p[1]<0||p[0]>=56||p[1]>=56)return {room:r.id,kind:'outside-map',cell:p.map(n=>Math.floor(n/8))};const blocker=entryBlocker(r);return blocker?{room:r.id,kind:'room-blocked',blocker:blocker.id}:null}
function plannedRoutes(){const owned=ownedSet(),blocked=new Set(activeRooms().flatMap(r=>r.blocks.map(b=>b.join(',')))),seen=new Map([['6,6',null]]),queue=[[6,6]];for(let i=0;i<queue.length;i++){const [x,y]=queue[i];for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const q=[x+dx,y+dy],k=q.join(',');if(owned.has(k)&&!blocked.has(k)&&!seen.has(k)){seen.set(k,[x,y].join(','));queue.push(q)}}}return activeRooms().map(r=>{const p=externalPoint(r),target=p.map(n=>Math.floor(n/8)).join(',');if(!seen.has(target))return {id:r.id,reachable:false,issue:entryIssue(r),points:[]};const path=[];for(let k=target;k!==null;k=seen.get(k))path.push(k.split(',').map(n=>Number(n)*8+4));path.reverse();return {id:r.id,reachable:true,issue:null,points:[[55,52],...path,r.entry]}})}
function blockType(c,r){if(!ownedSet().has(c+','+r))return 'future';if(activeRooms().some(a=>a.blocks.some(b=>b[0]===c&&b[1]===r)))return 'room';return 'corridor'}
function ground(){
 for(let r=0;r<7;r++)for(let c=0;c<7;c++){
  const type=blockType(c,r),bounds=[c*8,r*8,8,8];
  if(type==='future')outline(bounds,'#37515a',1,[6,7]);
  else floor(bounds);
 }
 if(document.querySelector('#grid').checked)for(const [c,r]of layout.purchaseOrder.slice(0,ownedCount))outline([c*8,r*8,8,8],'#a38b5d',1);
 outline([0,0,56,56],'#657a7a',2,[7,9]);outline([48,48,8,8],'#b0e1c8',3);
 const p=rect([48,48,8,8]);poly([p[1],p[2],[p[2][0],p[2][1]+6],[p[1][0],p[1][1]+6]],'#b19c70');poly([p[2],p[3],[p[3][0],p[3][1]+6],[p[2][0],p[2][1]+6]],'#978461');
}
function routes(){for(const r of plannedRoutes().filter(r=>r.reachable)){const points=r.points.map(p=>P(...p,.08));for(let n=0;n<points.length-1;n++)line(points[n],points[n+1],'#a1dfc6',5,[12,9])}}
function schematic(){
 const cell=78,L=127,T=24;pc.fillStyle='#19333d';pc.fillRect(0,0,plan.width,plan.height);
 for(let r=0;r<7;r++)for(let c=0;c<7;c++){const type=blockType(c,r);pc.fillStyle={room:'#704a50',corridor:'#b6a684',future:'#19333d'}[type];pc.fillRect(L+c*cell,T+r*cell,cell-2,cell-2);if(type==='future'){pc.strokeStyle='#425c66';pc.setLineDash([4,5]);pc.strokeRect(L+c*cell,T+r*cell,cell-2,cell-2);pc.setLineDash([])}else if(!layout.rooms.some(a=>a.blocks.some(b=>b[0]===c&&b[1]===r))){pc.fillStyle='#172e37';pc.font='17px system-ui';pc.textAlign='center';pc.fillText(c===6&&r===6?'起點':'走道',L+(c+.5)*cell,T+(r+.5)*cell+8)}}
 for(const room of activeRooms()){const [x,y,w,h]=room.rect;pc.fillStyle=room.id.startsWith('hall')?'#79515b':'#88734e';pc.fillRect(L+x/8*cell+3,T+y/8*cell+3,w/8*cell-8,h/8*cell-8);pc.fillStyle='#f3e3c5';pc.font='600 22px system-ui';pc.textAlign='center';pc.fillText(room.name,L+(x+w/2)/8*cell,T+(y+h/2)/8*cell+8)}
 for(const room of activeRooms()){const [x,y]=room.entry,color=entryIssue(room)?'#f3a49c':'#b1e1c7';pc.strokeStyle=color;pc.lineWidth=5;pc.beginPath();if(['front','back'].includes(room.entrySide)){pc.moveTo(L+(x-1.5)/8*cell,T+y/8*cell);pc.lineTo(L+(x+1.5)/8*cell,T+y/8*cell)}else{pc.moveTo(L+x/8*cell,T+(y-1.5)/8*cell);pc.lineTo(L+x/8*cell,T+(y+1.5)/8*cell)}pc.stroke()}
 pc.strokeStyle='#abe0c7';pc.lineWidth=3;pc.strokeRect(L+6*cell+2,T+6*cell+2,cell-6,cell-6);
 pc.fillStyle='#d9c391';pc.font='600 23px system-ui';pc.fillText('↑ 右下角入口',L+5.7*cell,T+7*cell+36);pc.fillStyle='#a5bfb5';pc.font='17px system-ui';pc.fillText('完整地圖 7×7 塊 · 未開發格不能行走',400,650);
}
function draw(){
 ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#142e38';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.imageSmoothingEnabled=false;
 ground();activeRooms().sort((a,b)=>a.rect[0]+a.rect[1]+(a.rect[2]+a.rect[3])/2-b.rect[0]-b.rect[1]-(b.rect[2]+b.rect[3])/2).forEach(r=>r.id.startsWith('hall')?hall(r):zone(r));
 for(const room of layout.rooms.filter(r=>r.id.startsWith('hall')&&!activeRooms().includes(r))){const owned=room.blocks.filter(b=>ownedSet().has(b.join(','))).length;if(owned){const p=P(room.rect[0]+8,room.rect[1]+8);plaque(`${room.name} 地板 ${owned}/4`,p[0],p[1],{size:23})}}
 if(document.querySelector('#routes').checked)routes();
 for(const room of activeRooms().filter(r=>!r.id.startsWith('hall'))){const [x,y,w]=room.rect,p=P(x+w/2,y+.4,3.2),b=entryIssue(room);const suffix=room.id==='toilets'?(b?' · 入口超出地圖':wcDirection==='east'?' · 入口向右':wcDirection==='west'?' · 入口向左':' · 入口向下'):'';plaque(room.name+suffix,p[0],p[1],{size:25,color:b?'#f3a49c':'#ebd6a8'})}
 const p=P(56,52);plaque('右下角起點／入口',p[0]+130,p[1]+35,{color:'#a7dbbd',size:28});
 const title=document.querySelector('#stage-title'),text=document.querySelector('#stage-text');
 title.textContent=ownedCount===1?'真正開局 · 只有一塊地板':ownedCount===49?'你選定的完整規劃':'逐塊擴建示例';
 text.textContent=ownedCount===1?'依你的配置，只有右下角一塊地板，五個區域都未在開局啟用。':ownedCount===49?'此處暫把49塊地板全部展開，檢視你選定的區域位置；這些房間不會因此變成已在開局啟用。':'只模擬地板逐塊擴建，房間出現代表規劃地塊齊備，不代表已決定開業條件或改動正式遊戲。';
 const issue=entryIssue(wc);document.querySelector('#entry-review').textContent=issue?'舊版比較：洗手間向下入口會開到地圖外（紅色標記）；目前已確認方向為向右。':wcDirection==='east'?'已確認：洗手間入口向右，接到館內走道；其他區域位置及右下角單塊開局保持不變。':'僅供比較：洗手間入口向左；目前已確認方向仍為向右。';
 document.querySelector('#expansion').value=ownedCount;
 document.querySelector('#floor-count').textContent=`${ownedCount} / 49 塊`;document.querySelector('#next').disabled=ownedCount===49;
 schematic();window.__modularMap={ready:true,ownedCount,grid:layout.grid,blocks:layout.blocks,blockSize:8,startBlock:layout.startBlock,initialFloorBlocks:1,initialRoomIds:[],ownedBlocks:layout.purchaseOrder.slice(0,ownedCount),roomIds:activeRooms().map(r=>r.id),roomRects:layout.rooms.map(r=>({id:r.id,rect:r.rect,entry:r.entry,entrySide:r.entrySide})),wcDirection,plannedRoutes:plannedRoutes(),entryConflict:issue,staff:false,waitingArea:false,routes:document.querySelector('#routes').checked};
}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{ownedCount=b.dataset.view==='full'?49:1;draw()}));
document.querySelector('#wc-door').addEventListener('change',e=>{setWcDirection(e.target.value);draw()});
document.querySelector('#expansion').addEventListener('input',e=>{ownedCount=Number(e.target.value);draw()});
document.querySelector('#next').addEventListener('click',()=>{ownedCount=Math.min(49,ownedCount+1);document.querySelector('#expansion').value=ownedCount;draw()});
document.querySelector('#routes').addEventListener('change',draw);document.querySelector('#grid').addEventListener('change',draw);
document.querySelector('#zoom').addEventListener('click',()=>{zoom=!zoom;canvas.style.width=zoom?'190%':'100%';document.querySelector('#zoom').textContent=zoom?'還原全圖':'放大檢視'});
draw();
