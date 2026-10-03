// node score.mjs → build/score.wav + build/events.json
// Stand-in for your app's own engine: replace the voices, keep the event log.
import fs from 'node:fs';

export const BPM = 128, BEATS = 32, SR = 48000;
const BEAT = 60 / BPM, LEN = Math.ceil(BEATS * BEAT * SR);
const L = new Float32Array(LEN), R = new Float32Array(LEN);
const events = { hits: [], notes: [], cues: [] };

let seed = 7;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

const add = (t, fn, dur, pan = 0) => {
  const i0 = Math.round(t * SR), n = Math.round(dur * SR);
  for (let i = 0; i < n && i0 + i < LEN; i++) {
    const v = fn(i / SR);
    L[i0 + i] += v * (1 - pan) * 0.5;
    R[i0 + i] += v * (1 + pan) * 0.5;
  }
};
const kick = (t, vel) => { add(t, (x) => vel * Math.sin(2 * Math.PI * (45 * x + 90 * (1 - Math.exp(-x * 30)) / 30)) * Math.exp(-x * 7), 0.5); events.hits.push([t, 0, vel]); };
const snare = (t, vel) => { add(t, (x) => vel * 0.6 * (rnd() * 2 - 1) * Math.exp(-x * 18), 0.3); events.hits.push([t, 1, vel]); };
const hat = (t, vel) => { add(t, (x) => vel * 0.25 * (rnd() * 2 - 1) * Math.exp(-x * 80), 0.06, 0.4); events.hits.push([t, 2, vel]); };
const bass = (t, note, dur) => {
  const f = 440 * 2 ** ((note - 69) / 12);
  add(t, (x) => 0.35 * Math.tanh(3 * Math.sin(2 * Math.PI * f * x)) * Math.min(1, x * 200) * Math.exp(-x * 2), dur);
  events.notes.push([t, note, 1, 1, 'bass'], [t + dur, note, 0, 0, 'bass']);
};

const line = [45, 45, 48, 43];
for (let b = 0; b < BEATS; b++) {
  const t = b * BEAT;
  if (b >= 4) kick(t, b % 4 === 0 ? 1 : 0.85);
  if (b >= 8 && b % 2 === 1) snare(t, 0.9);
  if (b >= 4) for (let k = 0; k < 2; k++) hat(t + k * BEAT / 2, k ? 0.5 : 0.8);
  if (b >= 8 && b < BEATS - 2) bass(t + BEAT / 2, line[Math.floor(b / 4) % 4], BEAT / 2);
}
events.cues.push({ k: 'drop', t: 8 * BEAT, d: 0 }, { k: 'title', t: 24 * BEAT, d: 8 * BEAT });

let peak = 0;
for (let i = 0; i < LEN; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const buf = Buffer.alloc(44 + LEN * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + LEN * 4, 4); buf.write('WAVEfmt ', 8);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write('data', 36); buf.writeUInt32LE(LEN * 4, 40);
for (let i = 0; i < LEN; i++) {
  buf.writeInt16LE(Math.round((L[i] / peak) * 0.9 * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round((R[i] / peak) * 0.9 * 32767), 46 + i * 4);
}
fs.mkdirSync('build', { recursive: true });
fs.writeFileSync('build/score.wav', buf);
fs.writeFileSync('build/events.json', JSON.stringify(events));
console.log(`build/score.wav · ${(LEN / SR).toFixed(2)} s · ${events.hits.length} hits · ${events.notes.length / 2} notes`);
