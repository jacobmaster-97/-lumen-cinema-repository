import {loadCinemaAssets} from './assets.mjs';
import {MOVIES} from './engine.mjs';
import {setPosterAssets,drawPoster} from './render.mjs?v=0.3.0';
const {manifest,images}=await loadCinemaAssets();setPosterAssets(images,manifest);
const names={seat:'階梯影廳座椅',bench:'候場長椅（本版未使用）',kiosk:'自助售票機',counter:'服務櫃枱',machine:'食品機器',bins:'回收桶',plant:'盆栽',utility:'清潔車',cubicle:'衛生間隔間',sink:'洗手盆',lockers:'員工儲物櫃',shelf:'用品架',poster:'海報燈箱',sconce:'壁燈'};
let tab='props';
function render(){const gallery=document.querySelector('#gallery');gallery.replaceChildren();
 const entries=tab==='props'?manifest.assets:tab==='actors'?manifest.actors.frames.filter(f=>f.row===0||f.row===2):MOVIES;
 for(const a of entries){const card=document.createElement('section');card.className='card';const canvas=document.createElement('canvas');canvas.width=240;canvas.height=tab==='posters'?360:260;card.append(canvas);const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
  let title,details;
  if(tab==='posters'){drawPoster(canvas,a);title=a.title;details=a.type+' · '+a.studio;}
  else{const [sx,sy,w,h]=a.region,scale=tab==='actors'?155/manifest.actors.reference_height:Math.min(200/w,210/h);c.drawImage(tab==='actors'?images.actors:images.props,sx,sy,w,h,Math.round(120-w*scale/2),Math.round(225-h*scale),w*scale,h*scale);title=tab==='actors'?(a.role==='patron'?'客人':'職員')+' · '+['左前','右前','右後','左後'][a.col]:names[a.kind];details=tab==='actors'?'四方向 · 兩個步行姿勢':a.id+' · '+w+' × '+h+' px';}
  const h=document.createElement('h2');h.textContent=title;const p=document.createElement('p');p.textContent=details;card.append(h,p);gallery.append(card);
 }
}
for(const button of document.querySelectorAll('[data-tab]'))button.onclick=()=>{tab=button.dataset.tab;document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b===button));render();};render();
