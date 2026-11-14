// World paths use the same room geometry/collision as the active map.
export function queuePosition(layout,kind,index){const r=layout.rooms.find(r=>r.id===kind);return [r.rect[0]+4.25+(index%2)*.5,r.rect[1]+6.25+Math.floor(index/2)*.5]}
export function patronRoute(scene,c,p){
 const l=scene.layout,d=l.destinations,h='hall'+(p.hall+1),from=c.from==='snacks'?d.snacks:d.tickets;
 if(c.stage==='arriving')return scene.nav.route(l.entrance,d.tickets);
 if(c.stage==='to-snacks')return scene.nav.route(d.tickets,d.snacks);
 if(c.stage==='to-hall'){
  const seat=scene.props.filter(o=>o.kind==='seat'&&o.room===h)[c.seat],room=l.rooms.find(r=>r.id===h),y=seat?seat.footprint[1]+seat.footprint[3]/2:d[h+'-rear'][1];
  return scene.nav.through([from,d[h+'-entry'],d[h+'-front'],[room.rect[0]+8.25,y]]);
 }
 if(c.stage==='exiting'||c.stage==='leaving'){
  const hall=c.stage==='exiting'||c.fromStage==='seated';
  return hall?scene.nav.through([d[h+'-rear'],d[h+'-front'],d[h+'-entry'],l.entrance]):scene.nav.route(c.fromStage?.includes('snack')?d.snacks:from||d.tickets,l.entrance);
 }
 return [];
}
