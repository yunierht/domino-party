"""Reproduce the user-selected Seca (09) exactly. Never substitutes another variant.
The warm source is an original synthesized asset; no audit directory dependency.
"""
from pathlib import Path
import wave,io,hashlib,numpy as np
root=Path(__file__).resolve().parent.parent
source=root/'assets/sounds/tile-wood-contact-warm.wav'
assert hashlib.sha256(source.read_bytes()).hexdigest()=='0d52b3b28aa45fa9e534cbe5c36a5a34d5696742cfc38eb58b9f47eaac8dbbb1','Source changed: preserve approved dry asset'
w=wave.open(str(source));sr=w.getframerate();x=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').astype(float)/32768;t=np.arange(len(x))/sr
def lp(y,hz):
 a=np.exp(-2*np.pi*hz/sr);z=np.empty_like(y);v=0.
 for i,n in enumerate(y):v=(1-a)*n+a*v;z[i]=v
 return z
y=lp(lp(x,1300),1300)*.8*(1-np.exp(-t/.004));y[-220:]*=np.linspace(1,0,220)
y=np.rint(y*32768).astype('<i2').astype(float)/32768
y=y*np.exp(-np.maximum(t-.020,0)/.070)*1.05;y[-220:]*=np.linspace(1,0,220)
b=io.BytesIO()
with wave.open(b,'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes(np.rint(y*32768).astype('<i2').tobytes())
data=b.getvalue();assert hashlib.sha256(data).hexdigest()=='c1b25446c5cb9362d56da3618df7ad1228db6a6e30a21a55e0dbe2a0bf9b0774','Output differs from approved sample; not written'
(root/'assets/sounds/tile-contact-dry-v1.wav').write_bytes(data)
print('Approved Seca reproduced byte-for-byte; 160 ms PCM mono 44100 Hz.')
