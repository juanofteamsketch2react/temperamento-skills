// node film.mjs --aspect 16x9|9x16 [--beats 4,8.5,26]
import { createCanvas } from '@napi-rs/canvas';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const FPS = 24, BPM = 128, BEAT = 60 / BPM, BEATS = 32;
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const [W, H] = arg('--aspect', '16x9') === '9x16' ? [1080, 1920] : [1920, 1080];
const S = Math.min(W, H) / 1080;

const CUT = {
  scenes: [
    { name: 'open', b0: 0, b1: 8 },
    { name: 'pulse', b0: 8, b1: 24 },
    { name: 'title', b0: 24, b1: 32 },
  ],
  captions: [
    { text: 'ONE IDEA', b0: 4, b1: 8 },
    { text: 'EVERY HIT', b0: 8, b1: 12 },
    { text: 'ON THE GRID', b0: 12, b1: 16 },
    { text: 'NOTHING FAKED', b0: 16, b1: 24 },
  ],
};

class Events {
  constructor(d) {
    this.hits = d.hits.map(([t, pad, vel]) => ({ t, pad, vel })).sort((a, b) => a.t - b.t);
    this.notes = d.notes.map(([t, note, vel, on]) => ({ t, note, vel, on: !!on }));
    this.cues = d.cues;
  }
  env(t, pads, tau = 0.12) {
    let m = 0;
    for (const h of this.hits) {
      if (h.t > t) break;
      if (pads.includes(h.pad)) m = Math.max(m, h.vel * Math.exp(-(t - h.t) / tau));
    }
    return m;
  }
  note(t) {
    let n = null;
    for (const e of this.notes) { if (e.t > t) break; n = e.on ? e : null; }
    return n;
  }
}

const mulberry = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const rand = mulberry(86);
const stars = Array.from({ length: 300 }, () => ({ x: rand(), y: rand(), z: rand() }));

const ev = new Events(JSON.parse(fs.readFileSync('build/events.json', 'utf8')));
const canvas = createCanvas(W, H);
const g = canvas.getContext('2d');

function frame(t) {
  const b = t / BEAT;
  const scene = CUT.scenes.find((s) => b >= s.b0 && b < s.b1) ?? CUT.scenes.at(-1);
  const kick = ev.env(t, [0]), snare = ev.env(t, [1], 0.2), hat = ev.env(t, [2], 0.04);

  g.fillStyle = '#09090d';
  g.fillRect(0, 0, W, H);

  for (const s of stars) {
    const z = (s.z - t * 0.15) % 1 + (s.z - t * 0.15 < 0 ? 1 : 0);
    const k = 0.15 / Math.max(z, 0.02);
    const x = W / 2 + (s.x - 0.5) * W * k, y = H / 2 + (s.y - 0.5) * H * k;
    g.fillStyle = `rgba(243,243,246,${Math.min(1, (1 - z) * (0.4 + hat))})`;
    g.fillRect(x, y, 2 * S * (1 - z) + 1, 2 * S * (1 - z) + 1);
  }

  if (scene.name !== 'open') {
    const r = (180 + 120 * kick) * S;
    const grad = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, r);
    grad.addColorStop(0, `rgba(255,122,24,${0.5 + 0.5 * kick})`);
    grad.addColorStop(1, 'rgba(255,122,24,0)');
    g.fillStyle = grad;
    g.beginPath(); g.arc(W / 2, H / 2, r, 0, Math.PI * 2); g.fill();
    const n = ev.note(t);
    if (n) {
      g.strokeStyle = '#46D6C8'; g.lineWidth = 3 * S;
      g.beginPath(); g.arc(W / 2, H / 2, (n.note - 30) * 12 * S, 0, Math.PI * 2); g.stroke();
    }
  }
  if (snare > 0.05) { g.fillStyle = `rgba(224,73,143,${snare * 0.35})`; g.fillRect(0, 0, W, H); }

  const cap = CUT.captions.find((c) => b >= c.b0 && b < c.b1);
  const text = scene.name === 'title' ? 'YOUR APP' : cap?.text;
  if (text) {
    const local = b - (scene.name === 'title' ? scene.b0 : cap.b0);
    const size = (scene.name === 'title' ? 180 : 110) * S * Math.min(1, 0.85 + local * 0.6);
    g.font = `900 ${size}px sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 30 * S;
    g.fillStyle = '#f3f3f6';
    g.fillText(text, W / 2, H / 2);
    g.shadowBlur = 0;
  }
}

const tag = `${W > H ? '16x9' : '9x16'}`;
fs.mkdirSync('out/stills', { recursive: true });

const stills = arg('--beats');
if (stills) {
  for (const b of stills.split(',').map(Number)) {
    frame(b * BEAT);
    fs.writeFileSync(`out/stills/${tag}_b${b}.png`, canvas.toBuffer('image/png'));
  }
  console.log(`stills → out/stills`);
} else {
  const out = `out/Film-${tag}.mp4`;
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-',
    '-i', 'build/score.wav', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-c:a', 'aac', '-b:a', '256k', '-shortest', out],
    { stdio: ['pipe', 'ignore', 'inherit'] });
  const total = Math.round(BEATS * BEAT * FPS);
  for (let i = 0; i < total; i++) {
    frame(i / FPS);
    if (!ff.stdin.write(canvas.data())) await new Promise((r) => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  console.log(`→ ${out}`);
}
