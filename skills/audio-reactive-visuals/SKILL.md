---
name: audio-reactive-visuals
description: Make visuals that move with music — real-time (live input, AUv3, Web Audio) and offline (video plugins, renders) — using FFT, spectral-flux beat detection and RMS energy, with every audio-driven value also hand-animatable. Use when building a visualizer, VJ tool, music video generator, audio-reactive shader or plugin, or when "the beat detection feels off".
---

# Audio-reactive visuals

## Features to compute (per hop)

| Feature | How | Feeds |
|---|---|---|
| `energy` | RMS of the hop → `1 - exp(-rms * k)` (k ≈ 20–60 × user reactivity), then one-pole smoothing | glow, size, brightness |
| `spectrum[32]` | 1024-pt FFT with a Hann window, magnitudes grouped into log-spaced bands, `1 - exp(-mag * k)` | bars, per-band motion |
| `bass/mid/treble` | sums over band ranges (≈ <250 Hz, 250–4k, >4k) | separate layers |
| `beatStrength` | spectral flux onset (below), decays `exp(-4.5 · dt)` | flashes, scatter, cuts |
| `beatPhase` | 0→1 between beats: from host transport if there is one, else from detected onsets/tempo | rings, pulses, sync |

## Spectral-flux onset detector

1. `flux = Σ max(0, mag[k] - prevMag[k])` over bins (half-wave rectified).
2. Keep a history (≈ 64 hops). Threshold = mean(history) × 1.05–1.5 (+ a small floor).
3. Onset if `flux > threshold` **and** at least ~250 ms since the last onset (debounce).
4. `beatStrength = clamp((flux - threshold) / threshold)`; decay between onsets.

`examples/analyzer.js` is a dependency-free implementation (offline or per-block).

## Real-time vs offline

- **Real-time** (live input, AUv3, Web Audio): analyze in the audio thread or an AnalyserNode, publish a small struct (lock-free / atomics) to the render thread each frame. Never allocate or lock on the audio thread.
- **Offline / video hosts** (After Effects, Premiere, FCP, your own film renderer) render frames out of order, multi-threaded and cached. **Analyze the whole track once, front to back**, into a time-indexed table, then each frame is a lookup. Key the cache by a hash of the audio content. Test: render forwards, backwards and random order → identical uniforms.
- With a musical host (AUv3, Ableton Link, DAW transport) prefer the host's beat position for `beatPhase`; use onsets only for accents.

## Design rules

- **Every audio-driven value is also a normal parameter.** `final = mix(param, audio, amount)`. Users can keyframe by hand, and the visual works with no audio at all.
- One user-facing **Reactivity** knob scales all `k`s. Defaults should look good on a mastered pop track *and* a quiet ambient one — test both.
- Smooth up fast, down slow (attack ≈ 10 ms, release ≈ 150–300 ms) or everything flickers.
- Give the user a **dice / randomize** that picks shader + palette + params from sane ranges, seeded so it is reproducible.
- Beat-synced cuts look intentional only if they land on the logged onset frame — round onset times to the frame, never to the nearest beat grid unless you have a transport.
