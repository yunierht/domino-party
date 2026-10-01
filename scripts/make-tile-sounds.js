const fs=require('fs'),path=require('path');
const sr=44100;let seed=71;
const noise=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1;};
// Original synthesis calibrated against measured reference contacts at 4.29,
// 5.59 and 6.76 s: 18-20 ms HF transient, short 3.07 kHz resonance.
// No reference waveform or sample is used.
for(const [name,duration,peak] of [['tile-move',.038,.065],['tile-place',.105,.19]]){
 const n=Math.round(sr*duration),samples=new Float64Array(n);let low=0;
 for(let i=0;i<n;i++){
  const t=i/sr,r=noise();low=.72*low+.28*r;
  const attack=1-Math.exp(-t/0.00035),tail=Math.min(1,(duration-t)/.008);
  const click=.32*(r-low)*Math.exp(-t/0.0048);
  const shell=.33*Math.sin(2*Math.PI*3068*t)*Math.exp(-t/0.0076)+.13*Math.sin(2*Math.PI*2659*t)*Math.exp(-t/.005);
  const wood=.23*low*Math.exp(-t/.013)+.15*Math.sin(2*Math.PI*786*t)*Math.exp(-t/.010)+.12*Math.sin(2*Math.PI*187*t)*Math.exp(-t/.014);
  samples[i]=(click+shell+wood)*attack*tail;
 }
 const scale=peak/Math.max(...samples.map(Math.abs)),out=Buffer.alloc(44+n*2);
 out.write('RIFF');out.writeUInt32LE(out.length-8,4);out.write('WAVEfmt ',8);out.writeUInt32LE(16,16);out.writeUInt16LE(1,20);out.writeUInt16LE(1,22);out.writeUInt32LE(sr,24);out.writeUInt32LE(sr*2,28);out.writeUInt16LE(2,32);out.writeUInt16LE(16,34);out.write('data',36);out.writeUInt32LE(n*2,40);
 samples.forEach((v,i)=>out.writeInt16LE(Math.round(v*scale*32767),44+i*2));
 fs.writeFileSync(path.join(__dirname,'../assets/sounds',name+'.wav'),out);
}
