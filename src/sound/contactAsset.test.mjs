import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

for (let hit = 1; hit <= 4; hit++) test(`original hit ${hit} preserves audible contacts without clipping`, () => {
  const wav = readFileSync(new URL(`../../assets/sounds/tile-contact-cycle-${hit}.wav`, import.meta.url));
  assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
  assert.equal(wav.toString('ascii', 8, 12), 'WAVE');
  let format, pcm;
  for (let offset = 12; offset + 8 <= wav.length;) {
    const size = wav.readUInt32LE(offset + 4);
    const chunk = wav.subarray(offset + 8, offset + 8 + size);
    const id = wav.toString('ascii', offset, offset + 4);
    if (id === 'fmt ') format = chunk;
    if (id === 'data') pcm = chunk;
    offset += 8 + size + (size % 2);
  }
  assert.ok(format && pcm);
  assert.equal(format.readUInt16LE(0), 1);
  const channels = format.readUInt16LE(2);
  assert.equal(channels, 2);
  assert.equal(format.readUInt16LE(14), 16);
  const rate = format.readUInt32LE(4);
  const duration = pcm.length / 2 / channels / rate;
  assert.ok(duration > 0.1 && duration <= 1.0);
  let peak = 0, earlyPeak = 0;
  for (let i = 0; i < pcm.length / 2; i++) {
    const magnitude = Math.abs(pcm.readInt16LE(i * 2));
    peak = Math.max(peak, magnitude);
    if (i < rate * channels * 0.08) earlyPeak = Math.max(earlyPeak, magnitude);
  }
  assert.ok(earlyPeak > 100, 'contact must preserve its quiet initial touch');
  assert.ok(peak > 1000, 'contact must contain its stronger impact');
  assert.ok(peak < 32767, 'asset must not clip');
});
