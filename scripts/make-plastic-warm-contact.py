"""Reproduce approved option 12, plastic/warm wood V3, byte for byte.
Uses the original synthesized warm source; no audit-folder dependencies.
"""
from pathlib import Path
import hashlib, io, wave
import numpy as np
root = Path(__file__).resolve().parent.parent
source = root / 'assets/sounds/tile-wood-contact-warm.wav'
assert hashlib.sha256(source.read_bytes()).hexdigest() == '0d52b3b28aa45fa9e534cbe5c36a5a34d5696742cfc38eb58b9f47eaac8dbbb1'
with wave.open(str(source)) as w:
    sr = w.getframerate()
    x = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').astype(float) / 32768
t = np.arange(len(x)) / sr
def lp(y, hz):
    a = np.exp(-2*np.pi*hz/sr)
    z = np.empty_like(y)
    v = 0.
    for i, n in enumerate(y):
        v = (1-a)*n+a*v
        z[i] = v
    return z
base = lp(lp(x, 1300), 1300)*.8*(1-np.exp(-t/.004))
base[-220:] *= np.linspace(1, 0, 220)
base = np.rint(base*32768).astype('<i2').astype(float)/32768
noise = np.random.default_rng(4931).normal(size=len(base))
plastic = lp(noise, 2300)-lp(noise, 850)
plastic /= max(abs(plastic))
contact = plastic*(1-np.exp(-t/.003))*np.exp(-t/.010)*.007
y = base*.92+contact+lp(base, 500)*.20
y[:44] *= np.linspace(0, 1, 44)
y[-440:] *= np.linspace(1, 0, 440)
b = io.BytesIO()
with wave.open(b, 'wb') as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(sr)
    w.writeframes(np.rint(y*32768).astype('<i2').tobytes())
data = b.getvalue()
assert hashlib.sha256(data).hexdigest() == 'df7dda04356c60a21effa475e5e3a3ae074b36149a281917f59fb0efcba8f035', 'Approved sample differs; not written'
(root / 'assets/sounds/tile-contact-plastic-warm-v3.wav').write_bytes(data)
print('Option 12 reproduced byte-for-byte, 160 ms PCM mono 44100 Hz.')
