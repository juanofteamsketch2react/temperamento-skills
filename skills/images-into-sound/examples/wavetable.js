const CURVES = {
  linear: (v) => v,
  gamma: (v) => Math.sqrt(v),
  scurve: (v) => v * v * (3 - 2 * v),
  fold: (v) => 1 - Math.abs(2 * v - 1),
  rectify: (v) => Math.abs(2 * v - 1),
  invert: (v) => 1 - v,
};
const CHANNELS = {
  rgb: (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b,
  r: (r) => r, g: (r, g) => g, b: (r, g, b) => b,
  chroma: (r, g, b) => 0.5 + 0.5 * (r - b),
};

export function rowToCycle(rgba, width, y, { channel = 'rgb', curve = 'linear' } = {}) {
  const out = new Float32Array(width), ch = CHANNELS[channel], cv = CURVES[curve];
  for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4;
    out[x] = cv(ch(rgba[i] / 255, rgba[i + 1] / 255, rgba[i + 2] / 255));
  }
  const mean = out.reduce((s, v) => s + v, 0) / width;
  let peak = 1e-9;
  for (let x = 0; x < width; x++) { out[x] -= mean; peak = Math.max(peak, Math.abs(out[x])); }
  for (let x = 0; x < width; x++) out[x] /= peak;
  return out;
}

function dft(x) {
  const n = x.length, re = new Float64Array(n), im = new Float64Array(n);
  for (let k = 0; k < n / 2; k++) for (let t = 0; t < n; t++) {
    const a = (-2 * Math.PI * k * t) / n;
    re[k] += x[t] * Math.cos(a); im[k] += x[t] * Math.sin(a);
  }
  return { re, im };
}

export function mipBank(cycle, sampleRate = 48000, lowestHz = 27.5, octaves = 10, size = 2048) {
  const src = Float32Array.from({ length: size }, (_, i) => cycle[Math.floor((i / size) * cycle.length)]);
  const { re, im } = dft(src);
  const bank = [];
  for (let o = 0; o < octaves; o++) {
    const topHz = lowestHz * 2 ** (o + 1);
    const maxHarm = Math.max(1, Math.min(size / 2 - 1, Math.floor(sampleRate / 2 / topHz)));
    const table = new Float32Array(size);
    for (let k = 1; k <= maxHarm; k++) {
      const amp = Math.hypot(re[k], im[k]) * 2 / size, ph = Math.atan2(im[k], re[k]);
      for (let t = 0; t < size; t++) table[t] += amp * Math.cos((2 * Math.PI * k * t) / size + ph);
    }
    bank.push({ topHz, maxHarm, table });
  }
  return bank;
}

export const pickMip = (bank, hz) => bank.find((m) => hz <= m.topHz) ?? bank.at(-1);
