export function createAnalyzer({ sampleRate = 48000, size = 1024, bands = 32, reactivity = 1 } = {}) {
  const hann = Float32Array.from({ length: size }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1)));
  const re = new Float32Array(size), im = new Float32Array(size);
  const half = size / 2, prev = new Float32Array(half), history = [];
  const edges = Array.from({ length: bands + 1 }, (_, b) => Math.min(half, Math.round(2 * (half / 2) ** (b / bands))));
  let energy = 0, beat = 0, sinceOnset = 1e9, lastOnset = -1;

  function fft() {
    for (let i = 1, j = 0; i < size; i++) {
      let bit = size >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
    }
    for (let len = 2; len <= size; len <<= 1) {
      const a = (-2 * Math.PI) / len, wr = Math.cos(a), wi = Math.sin(a);
      for (let i = 0; i < size; i += len) {
        let cr = 1, ci = 0;
        for (let k = 0; k < len / 2; k++) {
          const p = i + k, q = p + len / 2;
          const tr = re[q] * cr - im[q] * ci, ti = re[q] * ci + im[q] * cr;
          re[q] = re[p] - tr; im[q] = im[p] - ti; re[p] += tr; im[p] += ti;
          [cr, ci] = [cr * wr - ci * wi, cr * wi + ci * wr];
        }
      }
    }
  }

  return function analyze(block, time) {
    const dt = block.length / sampleRate;
    let rms = 0;
    for (let i = 0; i < size; i++) { const s = block[i] ?? 0; rms += s * s; re[i] = s * hann[i]; im[i] = 0; }
    rms = Math.sqrt(rms / size);
    fft();

    let flux = 0;
    const spectrum = new Float32Array(bands);
    for (let k = 0; k < half; k++) {
      const mag = Math.hypot(re[k], im[k]) / half;
      flux += Math.max(0, mag - prev[k]);
      prev[k] = mag;
    }
    for (let b = 0; b < bands; b++) {
      let m = 0;
      for (let k = edges[b]; k < Math.max(edges[b + 1], edges[b] + 1); k++) m = Math.max(m, Math.hypot(re[k], im[k]) / half);
      spectrum[b] = 1 - Math.exp(-m * 150 * reactivity);
    }

    history.push(flux);
    if (history.length > 64) history.shift();
    const threshold = (history.reduce((s, v) => s + v, 0) / history.length) * 1.3 + 1e-4;
    sinceOnset += dt;
    const onset = flux > threshold && sinceOnset > 0.25;
    if (onset) { beat = Math.min(1, (flux - threshold) / threshold); sinceOnset = 0; lastOnset = time; }
    else beat *= Math.exp(-4.5 * dt);

    const target = 1 - Math.exp(-rms * 40 * reactivity);
    energy += (target - energy) * (target > energy ? 0.6 : 0.08);

    return { time, energy, beatStrength: beat, onset, lastOnset, spectrum };
  };
}

export function analyzeTrack(samples, sampleRate, fps = 30) {
  const analyze = createAnalyzer({ sampleRate });
  const hop = Math.round(sampleRate / fps), frames = [];
  for (let i = 0; i + 1024 <= samples.length; i += hop) frames.push(analyze(samples.subarray(i, i + 1024), i / sampleRate));
  return frames;
}
