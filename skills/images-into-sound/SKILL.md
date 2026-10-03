---
name: images-into-sound
description: Turn pictures and shaders into instruments — scanlines into alias-free wavetables, image regions into drum kits, images read as spectrograms and resynthesized with an inverse FFT, visual effects mapped to audio effects. Use when building a synth or drum machine whose sounds come from images, video or shaders, or any "visual-to-audio" / sonification feature.
---

# Images into sound

One picture, read three ways. Each reading has a distinct character; offer them as engines.

## 1. CYCLE — a scanline is a waveform (wavetables)

- Render the image (or shader at time `t`) at e.g. 256 or 2048 px wide. Take row `y`.
- Luminance per pixel (or a channel mix: RGB, R, G, B, R−B, equal) → one cycle.
- **Centre and normalize**: subtract the mean (kills DC — images are 0…1, waveforms are ±1), then peak-normalize. Skip this and every table thumps and clips.
- A transfer **curve** before normalizing is a cheap, musical timbre control: linear, √ (gamma), S-curve, fold at 0.5 (wavefolder), rectify (doubles the fundamental), invert.
- **Morph frames**: render the shader 64 times across its time (linear, exponential, ping-pong…) or sweep a uniform (energy 0→1) → a 64-frame morphing wavetable.
- **Anti-aliasing**: build an FFT mip bank per frame — for each octave, FFT the cycle, zero harmonics above Nyquist for that octave's top note, iFFT. Pick the mip by playback pitch, crossfade between neighbours. Without this, bright images alias horribly above ~C5.
- Do the heavy table building off the audio thread (a worker / background queue) and swap pointers atomically.

## 2. SCAN — pixels end to end (one-shots)

Read many rows consecutively into one long buffer (raw pixels as samples). Noisy, textured images → hats, claps, noise bursts, glitch. Apply a short amp envelope and a DC blocker.

## 3. SPECTRAL — the image is a spectrogram

X = time, Y = frequency (log-mapped: top = treble, bottom = bass), brightness = magnitude. For each column: build a magnitude spectrum from the pixels, give it phase (random or phase-vocoder-continued), inverse FFT, overlap-add with a Hann window. A gradient becomes a sweep; a bright band becomes a resonance; text becomes a riser.

## Kits from one image

Give each of 16 pads its own region of the same image: its own row, channel weighting, curve and engine (CYCLE for kicks/toms/zaps with a pitch envelope, SCAN for hats/noise, SPECTRAL for cymbals/risers/reverse). Change the image → the whole kit remaps together and stays coherent. Show each pad the band of the image it reads.

## Visual effects → audio effects

If the visual side has modifiers, map them so the same chain shapes both:

| Visual | Audio reading |
|---|---|
| blur / bloom | horizontal blur on the row = low-pass on the waveform |
| RGB split | re-read the image at ±offset per channel = comb-filter-like harmonics |
| grain / film | noise + envelope + waveshaper |
| datamosh / block displace | smear between morph frames |
| invert / mask blend | waveform invert / ring-mod style blends |

## Gotchas

- Judge sounds by rendered phrases (a riff, a beat), not by one note on a sine-check. Single cycles always sound worse than they are.
- Periodic pixel patterns played live ring metallic; pre-render tables offline and favour smoother rows for pitched sounds.
- Keep the importer deterministic and shared: the same image must produce the same table in every app and in any render tool (see `sibling-app-code-sharing`).
- `examples/wavetable.js` has scanline → centred cycle → mip bank in ~60 lines.
