"""Original single-loop study: low-register bass, soft sustained keys, dry rhythm.
Reference informs only approximate pulse and spectral balance, never note sequence.
Requires numpy; writes deterministic 16-bar PCM loop. No third-party samples.
"""
from pathlib import Path
import numpy as np,wave
sr=44100;beat=60/126;length=16*4*beat;n=round(length*sr);mix=np.zeros(n);rng=np.random.default_rng(382)
def add(start,midi,duration,amp,kind):
 t=np.arange(round(duration*sr))/sr;f=440*2**((midi-69)/12)
 if kind=='bass':
  y=(np.sin(2*np.pi*f*t)+.22*np.sin(4*np.pi*f*t)+.05*np.sin(6*np.pi*f*t));env=(1-np.exp(-t/.009))*np.exp(-t/1.1)*np.minimum(1,(duration-t)/.065)
 else:
  y=sum(a*np.sin(2*np.pi*f*k*t+.001*np.sin(2*np.pi*1.7*t)) for k,a in [(1,1),(2,.25),(3,.09),(4,.025)])
  env=(1-np.exp(-t/.022))*np.exp(-t/1.2)*np.minimum(1,(duration-t)/.16)
 y=y*env*amp;idx=(round(start*sr)+np.arange(len(y)))%n;np.add.at(mix,idx,y)
chords=[(33,[57,60,64,67]),(38,[57,60,64,65]),(31,[55,59,62,65]),(36,[55,59,62,64]),(29,[57,60,64,67]),(35,[57,62,65,69]),(40,[56,59,62,67]),(33,[57,60,64,69])]
melody=[[64,67,69,67],[65,64,60],[62,65,67,71],[67,64,62],[64,69,67],[65,69,74,72],[71,67,68],[69,64,60]]
for bar in range(16):
 root,notes=chords[bar%8];base=bar*4*beat
 for off,note in [(0,root),(1.5,root+7),(2.5,root+12),(3.5,root+7)]:add(base+off*beat,note,.75*beat,.095,'bass')
 for off in [.5,2.5]:
  for j,note in enumerate(notes):add(base+off*beat+j*.011,note,1.6*beat,.017,'keys')
 for j,note in enumerate(melody[bar%8]):add(base+(.25+j*.85)*beat,note+(0 if bar<8 else -12),.9*beat,.028,'keys')
 for step in range(8):
  t=np.arange(round(.035*sr))/sr;noise=rng.normal(0,1,len(t));hp=noise-np.concatenate(([0],noise[:-1]));y=hp*np.exp(-t/.006)*.003
  idx=(round((base+step*.5*beat)*sr)+np.arange(len(t)))%n;np.add.at(mix,idx,y)
# Short quiet room taps, wrapped for continuous seam.
wet=mix.copy()
for delay,gain in [(.047,.12),(.083,.07),(.139,.035)]:wet+=np.roll(mix,round(delay*sr))*gain
wet*=.27/max(abs(wet));out=Path(__file__).resolve().parent.parent/'assets/sounds/table-lounge.wav'
with wave.open(str(out),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes((wet*32767).astype('<i2').tobytes())
print('Original loop',len(wet)/sr,'seconds; peak',max(abs(wet)),'RMS',np.sqrt(np.mean(wet**2)))
