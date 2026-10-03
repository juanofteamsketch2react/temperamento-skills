---
name: procedural-release-film
description: Make a 15–30 s launch/release film for an app entirely in code — frames drawn with node canvas and piped to ffmpeg, picture locked to a music score on a shared beat grid, every visual and sound coming from the app's own engine. Use when someone asks for a trailer, release video, App Store preview, promo or teaser for a creative app, or wants motion graphics without After Effects.
---

# Procedural release film

A release film made like this is a program, not a timeline. You can re-render it after every app update, in any aspect ratio, and it is honest: the shaders, sounds and screens on screen are the real product, not a mock-up.

## The ethos

**Nothing sampled, nothing faked.** If the app makes pictures, render them with the app's own renderer. If it makes sound, write the soundtrack with the app's own DSP. If a screen of the app appears, draw it from the app's real layout and data. This is what makes the film feel like the product and not like an ad for it. Ask the user which engines can be called headlessly before you start; build small CLI shims if needed (a 100-line Swift or C++ file that links the app's renderer and writes PNGs is normal).

## Architecture

```
score (C++/JS/Python)  ──►  score.wav + events.json      (every hit, note, cue with its time)
plates (app renderer)  ──►  build/plates/*.png           (the app's own visuals, pre-rendered)
film.mjs               ──►  frames ──stdin──► ffmpeg ──► out/<Name>-30s-16x9.mp4
```

1. **One grid.** Pick `BPM` and a beat count first (128 BPM × 64 beats = 30 s; 15 s = 32 beats). Every scene and caption is defined in beats: `{ name, b0, b1 }`. The score is composed on the same grid. Never time anything in seconds by hand.
2. **The score logs what it plays.** Whatever renders the music writes `events.json` alongside the wav: `hits: [[t, pad, vel]]`, `notes: [[t, note, vel, on, voice]]`, `cues: [{ k, t, d }]`. The picture reads this file. A flash happens because the snare was logged at that time — not because you guessed.
3. **Envelopes from events.** Give the film an `Events` class with `env(t, pads, tau)` (exponential decay from the latest hit), `last(t, pads)`, `hitsBetween(t0, t1)`, `cue(t, key)`. Scenes call these per frame.
4. **Frames to ffmpeg.** Draw each frame with `@napi-rs/canvas`, take raw RGBA (`canvas.data()`), write it to ffmpeg's stdin (`-f rawvideo -pix_fmt rgba -s WxH -r FPS -i -`), mux the wav, encode H.264 `yuv420p`. Respect backpressure: await `drain` when `write()` returns false.
5. **Seeded randomness.** Use a seeded PRNG (mulberry32 or similar) everywhere — particle fields, glitch, which shader cuts in. Same seed, same film, every render.
6. **Aspect is a flag.** `--aspect 16x9|9x16`. Lay out against `W`, `H` and a `S = min(W,H)/1080` scale; re-flow captions for portrait instead of cropping.
7. **Stills for review.** `--beats 8,24.5,52` writes PNGs instead of a video. Review stills (and show them to the user) before every full render. Full renders take minutes; stills take seconds.

See `examples/film.mjs` for a working ~150-line engine with all of the above, and `references/storyboard.md` for how to structure the 30 seconds.

## Workflow with the user

1. Ask: the app's one-line promise, its 4–6 strongest features, a visual era/genre to borrow (a 70s film, a VHS trailer, a 2001-style monolith…), 15 or 30 s.
2. Write the storyboard as a beat table (scene, beats, caption, what the music does). Get a yes.
3. Get the app's renderer callable from the command line → plates.
4. Write the score → `score.wav` + `events.json`. Listen-check is the user's job; never auto-play audio at them.
5. Build scenes one at a time, reviewing stills for each.
6. Full render both aspects. Check with `ffprobe` (duration, fps, audio present).
7. App Store previews need a separate encode (see the `ship-it-app-store` skill).

## Gotchas

- Fonts: register OFL fonts from files (`GlobalFonts.registerFromPath`); system fonts differ between machines.
- Text on video: draw a soft shadow or a scrim; thin type dies in H.264 at 10 Mbps.
- Captions should land *on* a hit (`b0` on a downbeat), and leave a beat before the next.
- Keep heavy work (shader renders, FFTs) out of the frame loop: pre-render plates, cache by frame index.
- `ffmpeg` stderr fills its pipe buffer if you never read it; pass `stdio: ['pipe', 'ignore', 'inherit']`.
- A 30 s film at 24 fps is 720 frames. If one frame takes >300 ms, profile before rendering both aspects.
