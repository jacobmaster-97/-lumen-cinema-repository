// Pointer gestures only own presentation until a validated drop commits the plan.
export function snapShowStart(start,length,minutes=780){
  return Math.max(0,Math.min(Math.floor((minutes-length)/5)*5,Math.round(start/5)*5));
}
export function installScheduleDrag(root,{getShow,validate,commit,reject=()=>{},suppressClick=()=>{},minutes=780,clock}={}){
  const doc=root.ownerDocument,win=doc.defaultView;let drag=null,frame=null;
  const tracks=()=>[...root.querySelectorAll('.timeline-track[data-hall]')];
  function position(){
    const d=drag;if(!d?.active)return;
    const outer=root.getBoundingClientRect(),track=tracks().find(t=>{const r=t.getBoundingClientRect();return d.y>=r.top&&d.y<=r.bottom});
    d.validTarget=!!track&&d.x>=outer.left-24&&d.x<=outer.right+24;
    const target=track||d.originalTrack,r=target.getBoundingClientRect();
    const start=snapShowStart((d.x-r.left-d.grab*d.length/minutes*r.width)/r.width*minutes,d.length,minutes),hall=Number(target.dataset.hall);
    const errors=d.validTarget?validate({...d.show,start,hall}):['請放在影廳時間列內'];
    d.candidate={...d.show,start,hall};d.errors=errors;
    const x=r.left-outer.left+root.scrollLeft+start/minutes*r.width,y=r.top-outer.top+root.scrollTop+4;
    Object.assign(d.preview.style,{left:x+'px',top:y+'px',width:d.length/minutes*r.width+'px'});
    Object.assign(d.buffer.style,{left:x+d.length/minutes*r.width+'px',top:y+'px',width:15/minutes*r.width+'px'});
    d.preview.classList.toggle('drop-invalid',errors.length>0);
    d.preview.querySelector('small').textContent=`${clock(start)}–${clock(start+d.length)}`;
    const message=`${hall+1} 號影廳 · ${clock(start)}–${clock(start+d.length)}${errors.length?' · '+errors[0]:''}`;
    if(d.feedback.textContent!==message)d.feedback.textContent=message;
    d.feedback.classList.toggle('drop-invalid',errors.length>0);
    Object.assign(d.feedback.style,{left:Math.max(8,Math.min(win.innerWidth-288,r.left+start/minutes*r.width))+'px',top:Math.max(8,r.top-58)+'px'});
  }
  function tick(time){
    if(!drag?.active)return;
    const d=drag,r=root.getBoundingClientRect(),dt=Math.min(32,time-(d.time||time-16));d.time=time;
    const direction=d.validTarget?(d.x<r.left+36?-1:d.x>r.right-36?1:0):0,before=root.scrollLeft;
    root.scrollLeft+=direction*dt*.45;if(root.scrollLeft!==before)position();
    frame=win.requestAnimationFrame(tick);
  }
  function activate(){
    const d=drag;d.active=true;d.button.classList.remove('touch-pressed');d.button.classList.add('schedule-drag-source');
    d.preview=doc.createElement('div');d.preview.className=d.button.className.replace('schedule-drag-source','')+' schedule-drag-preview';d.preview.innerHTML=d.button.innerHTML;d.preview.setAttribute('aria-hidden','true');d.preview.style.setProperty('--movie-color',d.button.style.getPropertyValue('--movie-color'));
    d.buffer=doc.createElement('span');d.buffer.className='clean-buffer schedule-drag-buffer';d.buffer.setAttribute('aria-hidden','true');root.append(d.buffer,d.preview);
    d.feedback=doc.createElement('output');d.feedback.className='schedule-drag-feedback';d.feedback.setAttribute('role','status');d.feedback.setAttribute('aria-live','polite');doc.body.append(d.feedback);
    position();frame=win.requestAnimationFrame(tick);
  }
  function finish(cancel=false){
    const d=drag;if(!d)return;drag=null;
    win.cancelAnimationFrame(frame);frame=null;d.button.classList.remove('touch-pressed','schedule-drag-source');
    d.preview?.remove();d.buffer?.remove();d.feedback?.remove();
    try{if(d.button.hasPointerCapture?.(d.id))d.button.releasePointerCapture(d.id)}catch{}
    suppressClick();
    if(cancel)return;
    if(!d.active){if(d.button.isConnected)d.button.click();return;}
    if(d.errors.length){reject(d.errors[0]);return;}
    if(d.candidate.start!==d.show.start||d.candidate.hall!==d.show.hall)commit(d.candidate);
  }
  function down(e){
    const button=e.target.closest('[data-schedule-drag]');
    if(!button||button.disabled||e.isPrimary===false||e.button!==0||drag)return;
    const show=getShow(button.dataset.id);if(!show)return;
    const r=button.getBoundingClientRect();e.preventDefault();
    drag={id:e.pointerId,button,show:{...show},length:Number(button.dataset.length),originalTrack:button.closest('.timeline-track'),grab:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),x:e.clientX,y:e.clientY,downX:e.clientX,downY:e.clientY,active:false};
    button.classList.add('touch-pressed');button.setPointerCapture?.(e.pointerId);
  }
  function move(e){
    if(!drag||e.pointerId!==drag.id)return;e.preventDefault();drag.x=e.clientX;drag.y=e.clientY;
    if(!drag.active&&Math.hypot(drag.x-drag.downX,drag.y-drag.downY)>=8)activate();else position();
  }
  function up(e){if(!drag||e.pointerId!==drag.id)return;e.preventDefault();if(drag.active){drag.x=e.clientX;drag.y=e.clientY;position()}finish()}
  function cancel(e){if(!e||!drag||e.pointerId===undefined||e.pointerId===drag.id)finish(true)}
  function second(e){if(drag&&e.pointerId!==drag.id)finish(true)}
  function key(e){if(drag&&e.key==='Escape'){e.preventDefault();finish(true)}}
  function hidden(){if(doc.hidden)finish(true)}
  const events=[[root,'pointerdown',down],[root,'pointermove',move],[root,'pointerup',up],[root,'pointercancel',cancel],[root,'lostpointercapture',cancel],[root,'scroll',position],[doc,'pointerdown',second,true],[doc,'keydown',key],[doc,'visibilitychange',hidden],[win,'blur',()=>finish(true)],[win,'resize',()=>finish(true)]];
  for(const [el,type,fn,capture] of events)el.addEventListener(type,fn,capture||false);
  return {destroy(){finish(true);for(const [el,type,fn,capture]of events)el.removeEventListener(type,fn,capture||false)}};
}
