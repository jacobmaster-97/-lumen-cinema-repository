import * as C from './construction.mjs';
import {placement} from './world.mjs';
export function modularLayout(branch,assets){
 const map=branch.map||C.fullMap(),built=new Set(map.built),rooms=C.ROOMS.map(r=>({...r,wall_height_m:r.id.startsWith('hall')?5.2:3}));
 const l={modular:true,grid:[56,56],rooms,terraces:[],walls:[],doors:[],queues:[],corridors:[],objects:[],obstacles:[],zoneObjects:[],floorBlocks:map.floors.slice(),built:map.built.slice(),entrance:[55.25,52.25],destinations:{},jobs:{},bounds:[-474,210,2748,1480]};
 for(const r of rooms.filter(r=>built.has(r.id))){
  const [x,y,w,h]=r.rect,isHall=r.id.startsWith('hall'),p=C.entry(r),axis=['east','west'].includes(r.door)?'v':'h',line=axis==='v'?p[0]:p[1],middle=axis==='v'?p[1]:p[0];
  const d={id:r.id+'-door',room:r.id,axis,line,a:middle-1,b:middle+1,threshold_m:0,clear:axis==='v'?[line-1.5,middle-1,3,2]:[middle-1,line-1.5,2,3]};l.doors.push(d);
  for(const wall of [{room:r.id,axis:'h',line:y,a:x,b:x+w},{room:r.id,axis:'h',line:y+h,a:x,b:x+w},{room:r.id,axis:'v',line:x,a:y,b:y+h},{room:r.id,axis:'v',line:x+w,a:y,b:y+h}]){
   if(wall.axis===axis&&wall.line===line){if(wall.a<d.a)l.walls.push({...wall,b:d.a});if(d.b<wall.b)l.walls.push({...wall,a:d.b})}else l.walls.push(wall)
  }
  const inside=r.door==='east'?[p[0]-.75,p[1]+.25]:r.door==='west'?[p[0]+.75,p[1]+.25]:[p[0]+.25,p[1]-.75];
  l.destinations[r.id+'-entry']=inside;
  if(isHall){
   const tiers=Array.from({length:8},(_,i)=>({row:i+1,front_y:y+4.5+i*1.25,back_y:y+5.75+i*1.25,seat_y:y+5.125+i*1.25,elevation_m:Number((i*.3).toFixed(2))}));
   const t={room:r.id,tiers,aisle_x:[x+7.25,x+8.75],stair_rise_m:.15,rear_elevation_m:2.1,rear_walkway:[x,y+14.5,w,1.5],stage:{rect:[x+.8,y+.7,w-1.6,2],height_m:.35},screen:{x:x+2,y:y+.1,width:w-4,bottom_m:1,top_m:4.3}};l.terraces.push(t);
   l.destinations[r.id+'-front']=[x+8.25,y+3.75];l.destinations[r.id+'-rear']=[x+8.25,y+15.25];
   const hIndex=Number(r.id.slice(-1))-1,count=branch.seats[hIndex],columns=Math.ceil(count/8),left=Math.ceil(columns/2),right=columns-left,spread=(n,a,b)=>Array.from({length:n},(_,i)=>n===1?(a+b)/2:a+(b-a)*i/(n-1));
   const base=hIndex?[2.8,4.6,10.1,11.9,13.7]:[2,3.7,5.4,10.3,12,13.7];
   const xs=columns===base.length?base.map(a=>x+a):[...spread(left,x+1,x+6.5),...spread(right,x+9.5,x+15)];let used=0;
   for(const tier of tiers)for(const cx of xs){if(used++>=count)break;l.objects.push({id:r.id+'-seat-'+used,kind:'seat',room:r.id,row:tier.row,rect:[cx-.4,tier.seat_y-.35,.8,.7],elevation_m:tier.elevation_m})}
  }else{
   l.zoneObjects.push(r);
   if(r.id==='toilets'){l.obstacles.push([x+.2,y+.2,3.8,3.6],[x+5.2,y+.1,2.6,2]);l.destinations.toilets=[x+6.25,y+5.25]}
   else{l.obstacles.push([x+1.5,y+3.6,5.1,1.1],[x+2,y+.1,5.8,1.6]);if(r.id==='tickets')l.obstacles.push([x+.1,y+.1,1.5,3]);l.destinations[r.id]=[x+4.25,y+6.25];l.jobs[r.id]=[[x+3.25,y+2.75],[x+5.25,y+2.75],[x+7.25,y+5.25]]}
  }
 }
 l.obstacles.push(...l.objects.map(o=>placement(o,assets).footprint));return l;
}
