// Authoritative minute-by-minute service. No DOM, clock, storage or renderer dependencies.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const fraction=n=>{let t=Math.imul(n^(n>>>16),0x45d9f3b);t=Math.imul(t^(t>>>16),0x45d9f3b);return ((t^(t>>>16))>>>0)/4294967296};
export const STAGES=['upcoming','arriving','ticket-queue','to-snacks','snack-queue','to-hall','seated','exiting','leaving','gone','withdrawn'];
export function rates(s,b,ctx){const active=s.minute<=b.buffs.until,snackSkill=ctx.roleSkill(b,'snacks');return {tickets:(10+ctx.roleSkill(b,'tickets')*9)/18*(1+(active?b.buffs.tickets:0)),snacks:snackSkill>0?(snackSkill*7+b.upgrades.counter*12)/18*(1+(active?b.buffs.snacks:0)):(active?b.buffs.snacks*1.5:0),cleaning:Math.max(.25,ctx.roleSkill(b,'cleaning')*.9+(active?b.buffs.cleaning/3:0))}}
const move=(c,stage,minute,duration=0)=>{c.stage=stage;c.at=minute;c.until=minute+duration};
export function prepare(s,b){
 b.flow={version:1,patrons:[],nextId:0,credits:{tickets:0,snacks:0},peak:{tickets:0,snacks:0},losses:{wait:0,capacity:0,cancelled:0,late:0},halls:[0,1].map(()=>({state:'ready',show:null,remaining:0,total:0,until:0}))};
 for(const p of b.shows){Object.assign(p,{sold:0,ticketGross:0,ticketShare:0,foodRevenue:0,foodCost:0,lost:0,flowDemand:0,actualStart:null,ended:false});syncDemand(s,b,p)}
}
function syncDemand(s,b,p){
 const f=b.flow,target=clamp(Math.round(p.demand*p.boost),0,1500);if(p.booked||p.cancelled)return;
 if(target<p.flowDemand){for(const c of f.patrons.filter(c=>c.show===p.id&&c.stage==='upcoming').reverse()){if(p.flowDemand<=target)break;move(c,'withdrawn',s.minute);p.flowDemand--;b.ledger.demand--}}
 const total=p.groups.reduce((a,n)=>a+n,0);
 while(p.flowDemand<target&&f.patrons.length<3000){const id=f.nextId++,salt=s.seed+s.day*1777+b.id*331+id*7919;let group=0,r=fraction(salt+7)*Math.max(1,total);for(let g=0;g<p.groups.length;g++){r-=p.groups[g];if(r<0){group=g;break}}
  const arrival=Math.max(s.minute+1,0,p.start-32+Math.floor(fraction(salt+13)*18));
  f.patrons.push({id,show:p.id,group,stage:'upcoming',arrival,patience:10+Math.floor(fraction(salt+31)*9),at:arrival,until:arrival,ticket:false,admitted:false,seat:-1,snackRoll:fraction(salt+43),foodRoll:fraction(salt+57),price:0,share:0,food:-1});p.flowDemand++;b.ledger.demand++;
 }
}
function refund(s,b,p,c){if(!c.ticket)return;b.ledger.gross-=c.price;b.ledger.share-=c.share;s.cash-=c.price-c.share;p.ticketGross-=c.price;p.ticketShare-=c.share;p.sold--;b.ledger.ticketsSold--;c.ticket=false;if(c.admitted){p.served--;b.ledger.admissions--;b.ledger.groups[c.group]--;c.admitted=false}}
function lose(s,b,p,c,reason){if(['gone','withdrawn','leaving','exiting'].includes(c.stage))return;c.fromStage=c.stage;refund(s,b,p,c);b.ledger.lost++;p.lost++;b.flow.losses[reason]++;c.reason=reason;move(c,c.stage==='upcoming'?'gone':'leaving',s.minute,3)}
export function reconcile(s,b,ctx){if(!b.flow)return;for(const p of b.shows){if(!p.cancelled){syncDemand(s,b,p);const share=ctx.movie(p.movie).share;for(const c of b.flow.patrons.filter(c=>c.show===p.id&&c.ticket)){const next=c.price*share,delta=next-c.share;c.share=next;p.ticketShare+=delta;b.ledger.share+=delta;s.cash-=delta}}else for(const c of b.flow.patrons.filter(c=>c.show===p.id))lose(s,b,p,c,'cancelled')}}
function foodChoice(b,c,ctx){const weights=ctx.FOODS.map((f,i)=>b.foodUnlocked[i]?Math.exp(-(b.foods[i]-f.price)/22)*(i===2?.6:1):0),total=weights.reduce((n,x)=>n+x,0)+.5;let r=c.foodRoll*total;for(let i=0;i<weights.length;i++){r-=weights[i];if(r<0)return i}return -1}
export function tick(s,b,ctx){
 const f=b.flow;if(!f)return;const minute=s.minute,rate=rates(s,b,ctx),byId=new Map(b.shows.map(p=>[p.id,p]));
 for(const p of b.shows){syncDemand(s,b,p);if(!p.booked&&minute>=p.start&&(p.cancelled||ctx.isBanned(s,p.movie)||b.closedUntil[p.hall]>p.start)){p.cancelled=true;for(const c of f.patrons.filter(c=>c.show===p.id))lose(s,b,p,c,'cancelled')}}
 for(let h=0;h<2;h++){
  const hall=f.halls[h],show=byId.get(hall.show);
  if(hall.state==='playing'&&minute>=hall.until){hall.state='exiting';hall.until=minute+4;show.ended=true;for(const c of f.patrons.filter(c=>c.show===show.id&&c.stage==='seated'))move(c,'exiting',minute,4)}
  if(hall.state==='exiting'&&minute>=hall.until){hall.state='cleaning';hall.total=24+(show?.served||0)*.15;hall.remaining=hall.total}
  if(hall.state==='cleaning'){hall.remaining=Math.max(0,hall.remaining-rate.cleaning);hall.until=minute+Math.ceil(hall.remaining/rate.cleaning);b.roomReady[h]=hall.until;if(!hall.remaining)hall.state='ready'}
  if(hall.state==='playing')b.roomReady[h]=hall.until+4+Math.ceil((24+(show?.served||0)*.15)/rate.cleaning);
  if(hall.state==='ready'){
   const p=b.shows.filter(p=>p.hall===h&&!p.cancelled&&!p.booked&&p.start<=minute).sort((a,b)=>a.start-b.start)[0];
   if(p){p.booked=true;p.actualStart=minute;p.delay=minute-p.start;b.ledger.delay+=p.delay;hall.state='playing';hall.show=p.id;hall.until=minute+ctx.movie(p.movie).length;b.roomReady[h]=hall.until+4+Math.ceil((24+p.sold*.15)/rate.cleaning)}
  }
 }
 for(const c of f.patrons){const p=byId.get(c.show);if(['gone','withdrawn'].includes(c.stage))continue;if(['exiting','leaving'].includes(c.stage)&&minute>=c.until){move(c,'gone',minute);continue}if(p.cancelled)continue;
  if(c.stage==='upcoming'&&minute>=c.arrival)move(c,'arriving',minute,2);
  else if(c.stage==='arriving'&&minute>=c.until)move(c,'ticket-queue',minute);
  else if(c.stage==='to-snacks'&&minute>=c.until)move(c,'snack-queue',minute);
  else if(c.stage==='to-hall'&&minute>=c.until){const hall=f.halls[p.hall],ready=hall.state==='ready'||hall.state==='playing'&&hall.show===p.id;if(ready){p.served++;c.admitted=true;b.ledger.admissions++;b.ledger.groups[c.group]++;move(c,'seated',minute)}else if(minute-c.at>c.patience)lose(s,b,p,c,'late')}
  else if(['exiting','leaving'].includes(c.stage)&&minute>=c.until)move(c,'gone',minute);
 }
 const queue=stage=>f.patrons.filter(c=>c.stage===stage).sort((a,b)=>a.at-b.at||a.id-b.id);
 for(const c of queue('ticket-queue')){const p=byId.get(c.show),cutoff=Math.min(p.start+40,Math.max(p.start,b.roomReady[p.hall]))-3;if(p.sold>=b.seats[p.hall])lose(s,b,p,c,'capacity');else if(minute-c.at>=c.patience)lose(s,b,p,c,'wait');else if(p.booked||minute>cutoff)lose(s,b,p,c,'late')}
 for(const role of ['tickets','snacks']){
  const waiting=queue(role==='tickets'?'ticket-queue':'snack-queue');f.peak[role]=Math.max(f.peak[role],waiting.length);f.credits[role]=Math.min(rate[role]+1,f.credits[role]+rate[role]);
  for(const c of waiting){const p=byId.get(c.show);
   if(role==='snacks'&&(minute-c.at>=8||minute>=p.start-3)){b.ledger.snackLost++;c.from='snacks';move(c,'to-hall',minute,3);continue}
   if(f.credits[role]<1)continue;f.credits[role]--;
   if(role==='tickets'){
    if(p.sold>=b.seats[p.hall]){lose(s,b,p,c,'capacity');continue}
    const used=new Set(f.patrons.filter(a=>a.show===p.id&&a.ticket).map(a=>a.seat));c.seat=0;while(used.has(c.seat))c.seat++;c.ticket=true;c.price=p.price;c.share=p.price*ctx.movie(p.movie).share;p.sold++;p.ticketGross+=c.price;p.ticketShare+=c.share;b.ledger.ticketsSold++;b.ledger.gross+=c.price;b.ledger.share+=c.share;s.cash+=c.price-c.share;
    const snack=c.snackRoll<ctx.COHORTS[c.group].snack*(1+(minute<=b.buffs.until?b.buffs.snacks*.3:0));c.food=snack?foodChoice(b,c,ctx):-1;
    c.from='tickets';move(c,c.food>=0&&minute<p.start-7?'to-snacks':'to-hall',minute,c.food>=0&&minute<p.start-7?2:3);
   }else{const i=c.food;const revenue=b.foods[i],cost=ctx.FOODS[i].cost;p.food[i]++;p.foodRevenue+=revenue;p.foodCost+=cost;b.ledger.snackUnits[i]++;b.ledger.foodRevenue+=revenue;b.ledger.foodCost+=cost;s.cash+=revenue-cost;c.from='snacks';move(c,'to-hall',minute,3)}
  }
 }
}
export function close(s,b){if(!b.flow)return;const byId=new Map(b.shows.map(p=>[p.id,p]));for(const c of b.flow.patrons)if(c.ticket&&!c.admitted)lose(s,b,byId.get(c.show),c,'late');else if(!c.ticket&&!['gone','withdrawn','leaving','exiting'].includes(c.stage))lose(s,b,byId.get(c.show),c,'late')}
export function snapshot(s,b,ctx){if(!b.flow)return null;const f=b.flow,count=stage=>f.patrons.filter(c=>c.stage===stage).length,tickets=f.patrons.filter(c=>c.stage==='ticket-queue'),snacks=f.patrons.filter(c=>c.stage==='snack-queue');return {tickets:tickets.length,snacks:snacks.length,arriving:count('arriving'),seated:count('seated'),departing:count('exiting')+count('leaving'),waitingHall:count('to-hall'),waitTickets:tickets.reduce((n,c)=>Math.max(n,s.minute-c.at),0),waitSnacks:snacks.reduce((n,c)=>Math.max(n,s.minute-c.at),0),lost:b.ledger.lost,snackLost:b.ledger.snackLost,losses:{...f.losses},peak:{...f.peak},rates:rates(s,b,ctx),support:{tickets:s.minute<=b.buffs.until&&b.buffs.tickets>0,snacks:s.minute<=b.buffs.until&&b.buffs.snacks>0,cleaning:s.minute<=b.buffs.until&&b.buffs.cleaning>0},halls:f.halls.map(h=>({...h})),staff:['tickets','snacks','cleaning'].map(role=>({role,count:b.staff.filter(p=>p.role===role).length,skill:ctx.roleSkill(b,role)}))}}
export function validate(b){
 const f=b.flow;if(!f)return;if(f.version!==1||!Array.isArray(f.patrons)||f.patrons.length>3000||!Array.isArray(f.halls)||f.halls.length!==2||!Number.isInteger(f.nextId)||f.nextId<0||!f.credits||!f.peak||!f.losses)throw Error('營運客流存檔無效');
 const ids=new Set(),shows=new Set(b.shows.map(p=>p.id));for(const c of f.patrons){if(!Number.isInteger(c.id)||c.id<0||c.id>=f.nextId||ids.has(c.id)||!shows.has(c.show)||!Number.isInteger(c.group)||c.group<0||c.group>5||!STAGES.includes(c.stage)||!['at','until','arrival','patience','snackRoll','foodRoll','price','share'].every(k=>Number.isFinite(c[k])&&c[k]>=0)||c.price>300||c.share>c.price||c.snackRoll>1||c.foodRoll>1||typeof c.ticket!=='boolean'||typeof c.admitted!=='boolean'||c.admitted&&!c.ticket||!Number.isInteger(c.seat)||c.seat< -1||c.seat>1000||!Number.isInteger(c.food)||c.food< -1||c.food>2)throw Error('客流資料無效');ids.add(c.id)}
 for(const h of f.halls)if(!['ready','playing','exiting','cleaning'].includes(h.state)||!['remaining','total','until'].every(k=>Number.isFinite(h[k])&&h[k]>=0)||h.show!==null&&!shows.has(h.show))throw Error('影廳工作資料無效');for(const object of [f.credits,f.peak,f.losses])if(Object.values(object).some(n=>!Number.isFinite(n)||n<0))throw Error('排隊資料無效');
 for(const p of b.shows)if(!['sold','ticketGross','ticketShare','foodRevenue','foodCost','lost','flowDemand'].every(k=>Number.isFinite(p[k])&&p[k]>=-1e-6)||p.sold>b.seats[p.hall]||p.served>p.sold)throw Error('場次客流資料無效');
 if(!['ticketsSold','snackLost'].every(k=>Number.isFinite(b.ledger[k])&&b.ledger[k]>=0))throw Error('客流收支資料無效');
 const holders=f.patrons.filter(c=>c.ticket),same=(a,b)=>Math.abs(a-b)<1e-5;
 if(holders.length!==b.ledger.ticketsSold||holders.filter(c=>c.admitted).length!==b.ledger.admissions||!same(holders.reduce((n,c)=>n+c.price,0),b.ledger.gross)||!same(holders.reduce((n,c)=>n+c.share,0),b.ledger.share))throw Error('客流收支不一致');
 for(const p of b.shows){const people=holders.filter(c=>c.show===p.id);if(people.length!==p.sold||people.filter(c=>c.admitted).length!==p.served||new Set(people.map(c=>c.seat)).size!==people.length)throw Error('場次客流不一致')}
}
