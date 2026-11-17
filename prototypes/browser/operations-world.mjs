import {entry} from './construction.mjs';
// World paths use the same room geometry/collision as the active map.
const seatIndexes=new WeakMap();
export function sceneSeats(scene,hall){
 let index=seatIndexes.get(scene);
 if(!index||index.props!==scene.props){index={props:scene.props,halls:[0,1].map(h=>scene.props.filter(o=>o.kind==='seat'&&o.room===`hall${h+1}`))};seatIndexes.set(scene,index)}
 return index.halls[hall]||[];
}
export function queuePosition(layout,kind,index){const r=layout.rooms.find(r=>r.id===kind);return [r.rect[0]+4.25+(index%2)*.5,r.rect[1]+6.25+Math.floor(index/2)*.5]}
export function patronRoute(scene,c,p,hall=null){
 const l=scene.layout,d=l.destinations,h='hall'+(p.hall+1),from=c.from==='snacks'?d.snacks:d.tickets;
 if(c.stage==='arriving')return scene.nav.route(l.entrance,d.tickets);
 if(c.stage==='to-snacks')return scene.nav.route(d.tickets,d.snacks);
 if(c.stage==='to-hall'){
  if(hall&&hall.state!=='ready'&&!(hall.state==='playing'&&hall.show===p.id)){const r=l.rooms.find(r=>r.id===h),xy=entry(r);xy[0]+=r.door==='east'?.75:r.door==='west'?-.75:0;xy[1]+=r.door==='south'?.75:r.door==='north'?-.75:0;return scene.nav.route(from,xy)}
  const seat=sceneSeats(scene,p.hall)[c.seat],room=l.rooms.find(r=>r.id===h),y=seat?seat.footprint[1]+seat.footprint[3]/2:d[h+'-rear'][1];
  return scene.nav.through([from,d[h+'-entry'],d[h+'-front'],[room.rect[0]+8.25,y]]);
 }
 if(c.stage==='exiting'||c.stage==='leaving'){
  const hall=c.stage==='exiting'||c.fromStage==='seated';
  return hall?scene.nav.through([d[h+'-rear'],d[h+'-front'],d[h+'-entry'],l.entrance]):scene.nav.route(c.fromStage?.includes('snack')?d.snacks:from||d.tickets,l.entrance);
 }
 return [];
}
