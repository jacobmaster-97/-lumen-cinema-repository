export class CinemaAudio {
  constructor(){this.enabled=false;this.context=null;try{this.enabled=localStorage.getItem('lumen-audio')==='on';}catch{}}
  toggle(){this.enabled=!this.enabled;try{localStorage.setItem('lumen-audio',this.enabled?'on':'off');}catch{}if(this.enabled)this.play('open');return this.enabled;}
  play(kind='tap'){
    if(!this.enabled)return;
    try{
      const API=window.AudioContext||window.webkitAudioContext;if(!API)return;
      this.context||=new API();this.context.resume();
      const notes={tap:[523.25],open:[392,523.25,659.25],event:[659.25,523.25],close:[523.25,659.25,783.99]}[kind]||[523.25],now=this.context.currentTime;
      for(let i=0;i<notes.length;i++){
        const o=this.context.createOscillator(),g=this.context.createGain(),at=now+i*.09;o.type='sine';o.frequency.value=notes[i];g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(.045,at+.012);g.gain.exponentialRampToValueAtTime(.0001,at+.16);o.connect(g);g.connect(this.context.destination);o.start(at);o.stop(at+.18);
      }
    }catch{/* Optional sound never blocks management or saving. */}
  }
}
