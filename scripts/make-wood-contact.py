"""Original wood/table contact from measured scalar targets, with no recorded samples.
Reference: user video 20260930_224231.mp4, contact around 2.04 s.
Measured resonances 267/700/1200/1540/1707/2307/3740 Hz;
central 90% energy ~65 ms, spectral centroid ~2326 Hz.
"""
import numpy as np,wave
from pathlib import Path
sr=44100;n=round(.16*sr);t=np.arange(n)/sr;rng=np.random.default_rng(947)
f=np.fft.rfftfreq(n,1/sr)
# Broad damped resonances excited by fresh deterministic noise, not musical notes.
shape=np.zeros(len(f))
for hz,width,gain in [(267,120,.55),(700,220,.85),(1200,280,.8),(1540,260,.45),(1707,300,.30),(2307,450,.18),(3740,650,.035)]:
 shape+=gain*np.exp(-.5*((f-hz)/width)**2)
shape *= 1 / (1 + (f/2200)**6)
noise=np.fft.irfft(np.fft.rfft(rng.normal(size=n))*np.sqrt(shape),n)
env=(1-np.exp(-t/.006))**2*np.exp(-t/.036)*np.minimum(1,(.16-t)/.020)
y=noise*env;y-=y.mean();y[:44]*=np.linspace(0,1,44);y[-882:]*=np.linspace(1,0,882);y*=.25/max(abs(y))
p=Path(__file__).resolve().parent.parent/'assets/sounds/tile-wood-contact-warm.wav'
with wave.open(str(p),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes(np.rint(y*32767).astype('<i2').tobytes())
c=np.cumsum(y*y)/sum(y*y);P=abs(np.fft.rfft(y*np.hanning(n)))**2
print('original contact',len(y)/sr,'s; 5-95% energy ms',np.searchsorted(c,[.05,.95])*1000/sr,'centroid',sum(P*f)/sum(P))
