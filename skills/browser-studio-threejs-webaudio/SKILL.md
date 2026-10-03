---
name: browser-studio-threejs-webaudio
description: Build a playable 3D music space in the browser — a three.js room modelled by a Blender script, instruments in Web Audio/AudioWorklet (or your native C++ DSP compiled to WebAssembly), one look-ahead clock, deployed as a static folder with no build step. Use when making a web toy, playable demo of native apps, interactive music site, or 3D studio/room experience.
---

# A playable studio in the browser

## Stack

- **Static site, no bundler.** ES modules + an import map for three.js from a CDN. `python3 -m http.server` to run locally.
- **three.js** (WebGL2) for the room, live screens (render targets / canvas textures), picking, post (bloom, a VHS pass).
- **Web Audio**: an AudioWorklet runs the instruments sample-accurately; a Worker builds heavy tables off both the main and audio threads.
- **The room** is a `.glb` produced by a Python script run headless in Blender. Code, not clicks: diffable, re-runnable, agent-editable.

## Blender as a build step

```bash
blender -b -P blender/room.py      # → assets/room.glb
```

- The script builds everything from primitives + bevels + materials, names every interactive object (`knob_cutoff`, `screen_tv_1`, `fader_3`) so JS can find it with `getObjectByName`.
- Screens are flat quads with a named material; JS swaps in live textures.
- Export with `bpy.ops.export_scene.gltf(export_format='GLB', export_apply=True)`.
- Bake lighting into textures if you want the '80s showroom look on phones.

## Audio

- One **transport** with a look-ahead scheduler (schedule ~100 ms ahead every 25 ms from `audioCtx.currentTime`), shared by every instrument, the visuals and the song player.
- If you have native DSP in C++, compile it with Emscripten to a small `.wasm` and run it inside the AudioWorklet — the browser plays your app's real engine. Keep a pure Web Audio fallback.
- AudioContext starts on a user gesture: a big Start button.
- A mixing desk: per-instrument gain/pan/mute/solo → a limiter on the master. Auto-level random rolls.
- Offer **bounce**: render a loop with `OfflineAudioContext` (or record the worklet output) and hand back a WAV.

## Deploy (cache-proof static folder)

`tools/build_dist.mjs` copies the site to `dist/` and appends `?v=<content hash>` to the entry script, to every relative `import` inside the modules and to big assets (`room.glb?v=…`). Same folder layout every time; uploads over the old version never serve stale code. Fail the build if a replacement target is not found. See `examples/build_dist.mjs`.

## Gotchas

- `audioWorklet.addModule` and `new Worker` need http(s) — never `file://`.
- Pixel readbacks (`readPixels`) from the render loop stall the GPU; read small regions, every N frames, into a reused buffer.
- Mobile: cap devicePixelRatio at 2, cut shadow maps, pause rendering when the tab is hidden.
- Share card: capture the real room from the canvas (`toDataURL` after a render with `preserveDrawingBuffer` for that frame) rather than mocking one.
- To ship it as an app later, see `web-app-to-native-wrapper`.
