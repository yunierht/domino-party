// Synthesizes the app's UI sound effects as small 16-bit PCM WAV files, so we
// don't ship/borrow external audio. Run: `node scripts/make-sounds.js`.
// Outputs assets/sounds/tap.wav (soft score click) and win.wav (victory chime).

const fs = require('fs');
const path = require('path');

const SR = 44100;

function writeWav(filename, samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }
  fs.writeFileSync(filename, buf);
  console.log('wrote', path.basename(filename), `(${(buf.length / 1024).toFixed(1)} kB)`);
}

function normalize(arr, peak = 0.85) {
  let max = 0;
  for (const v of arr) max = Math.max(max, Math.abs(v));
  if (max > 0) {
    const g = peak / max;
    for (let i = 0; i < arr.length; i++) arr[i] *= g;
  }
  return arr;
}

function fades(arr, fadeIn = 0.002, fadeOut = 0.02) {
  const n = arr.length;
  const fi = Math.floor(SR * fadeIn);
  const fo = Math.floor(SR * fadeOut);
  for (let i = 0; i < fi; i++) arr[i] *= i / fi;
  for (let i = 0; i < fo; i++) arr[n - 1 - i] *= i / fo;
  return arr;
}

// Soft, woody "tap": a sine pop that drops in pitch with a fast decay.
function makeTap() {
  const dur = 0.07;
  const n = Math.floor(SR * dur);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = 470 - 150 * (t / dur); // 470 → 320 Hz
    const amp = Math.exp(-t * 52) * 0.4;
    out[i] = Math.sin(2 * Math.PI * f * t) * amp;
  }
  return fades(normalize(out, 0.5), 0.001, 0.012);
}

// Cheerful ascending arpeggio (C5–E5–G5–C6) with a bell-like decay.
function makeWin() {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  const step = 0.15;
  const ring = 0.4;
  const total = Math.floor(SR * (step * notes.length + ring));
  const out = new Float32Array(total);
  notes.forEach((f, idx) => {
    const start = Math.floor(SR * step * idx);
    const len = Math.floor(SR * (step + ring));
    for (let i = 0; i < len && start + i < total; i++) {
      const t = i / SR;
      const env = Math.min(1, t / 0.006) * Math.exp(-t * 5.5);
      out[start + i] +=
        (Math.sin(2 * Math.PI * f * t) + 0.35 * Math.sin(2 * Math.PI * f * 2 * t)) * 0.3 * env;
    }
  });
  return fades(normalize(out, 0.82), 0.003, 0.06);
}

const dir = path.join(__dirname, '..', 'assets', 'sounds');
fs.mkdirSync(dir, { recursive: true });
writeWav(path.join(dir, 'tap.wav'), makeTap());
writeWav(path.join(dir, 'win.wav'), makeWin());
