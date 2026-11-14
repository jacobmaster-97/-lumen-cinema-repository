// Generated source sheets stay intact. Chroma extraction is a one-time import step.
export async function loadCinemaAssets() {
  const response=await fetch('./assets/runtime/manifest.json?v=0.6.0');
  if(!response.ok)throw Error('新版戲院素材清單未能載入');
  const manifest=await response.json();
  const images=Object.fromEntries(await Promise.all(Object.entries(manifest.files).map(async([key,file])=>{
    const image=new Image();image.src='./assets/runtime/'+file;await image.decode();return [key,image];
  })));
  const actors=document.createElement('canvas');actors.width=images.actors.width;actors.height=images.actors.height;
  const c=actors.getContext('2d',{willReadFrequently:true});c.drawImage(images.actors,0,0);
  const pixels=c.getImageData(0,0,actors.width,actors.height),p=pixels.data;
  for(let n=0;n<p.length;n+=4)if(p[n+1]>155&&p[n+1]>p[n]*1.5+25&&p[n+1]>p[n+2]*1.5+25)p[n+3]=0;
  c.putImageData(pixels,0,0);images.actors=actors;
  return {manifest,images};
}
