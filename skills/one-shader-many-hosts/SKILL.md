---
name: one-shader-many-hosts
description: Write fragment shaders once and run them everywhere — iOS/macOS Metal, Android Vulkan, WebGL2, After Effects, Final Cut Pro/Motion, Premiere, Blender — from one canonical GLSL source with a shared preamble and a SPIR-V cross-compile pipeline. Use when building a shader/visual effects app or plugin, porting a shader library to another platform, or designing a shader "pack" format users can write for.
---

# One shader, many hosts

The asset that compounds is the shader corpus, not any single app. Make the corpus host-agnostic on day one and every new host (a phone app, a web editor, a video plugin) is a thin shell.

## 1. The shader contract

Define one tiny entry point and a fixed uniform API. Users and agents only ever write this:

```glsl
vec4 fx_main(vec2 uv) {          // uv 0..1
  float t = U.time * U.speed;
  vec3 c = palette(uv.x + t * 0.1, U.palette);
  return vec4(c * (0.4 + U.energy), 1.0);
}
```

- **No** `#version`, `in/out`, `layout`, `precision`, `main()`. The host's *preamble* supplies those and the *epilogue* calls `fx_main`.
- Uniforms live in one struct `U`: `time, resolution, speed, energy, beatPhase, beatStrength, palette, p0..p3`. Every field has a documented range. Keep it small and stable; adding fields later is fine, renaming is not.
- Ship shared helpers in the preamble (a cosine palette table is a great one: `a + b*cos(2π(c*t + d))`, 30-ish presets indexed by an int).
- Write the contract in one markdown file (`references/contract-template.md`) and treat it as an API.

## 2. The pipeline

```
fx_main snippet ─► preamble + snippet + epilogue ─► glslang/shaderc ─► SPIR-V
                                                                        ├─ Vulkan (Android): use directly
                                                                        └─ SPIRV-Cross ─► MSL (Metal) · HLSL · GLSL ES 3.0 (WebGL2)
```

- Build-time: compile the whole bundled catalog and embed the outputs. **A broken shader fails the build.**
- Runtime: user imports go through the *same* code path.
- Use a regular UBO (`set=0, binding=0`) rather than push constants if you need SPIRV-Cross to map it to Metal argument buffers / kernel args.
- For WebGL you can skip SPIR-V: text-rewrite the snippet (`U.time` → `U_time` uniforms) and prepend a GLSL ES preamble. Keep that rewriter tiny and shared between web tools.
- Video plugins (AE/FCP/Premiere): render as a **compute kernel** writing into the host's output texture; no raster pipeline needed for full-screen effects.

## 3. Host-agnostic core

```
src/shaderpipe/  preamble, compile, cross-compile        ← identical in every host
src/catalog/     the shader table (id, name, pack, defaults)
src/audio/       analysis (see audio-reactive-visuals skill)
src/runtime/     uniform struct, param ↔ uniform mapping
src/plugin/      ONLY this differs per host
```

Copy the core byte-for-byte between host repos and check parity with `diff -r`. One fix lands everywhere.

## 4. Verify like you mean it

- **Compile every shader** on every backend in CI or a CLI tool. Count passes, count failures, print both.
- **Uniform layout test**: a unit test that asserts offsets/sizes of the uniform struct on each backend match. Off-by-16-bytes bugs look like "the palette is wrong".
- **Golden images**: render each shader at fixed time/params on each backend, diff against a reference, flag drift (`mod`, `atan`, precision differ subtly between backends).
- A thumbnail generator (CLI) doubles as the golden-image renderer and the pack's browse UI.

## Gotchas (all learned the hard way)

- **GLSL reserved words as identifiers** compile on one backend and break on another. Never name things `active, common, partition, input, output, filter, sizeof, cast, namespace, using, this, class, enum, union, typedef, template, goto, inline, public, static, extern, interface, long, short, half, fixed, unsigned, superp, resource`.
- **Silent fallback**: many runtimes show a default shader when compile fails. Log loudly and count failures; never trust "it shows something".
- **Shader keys must be filename-safe** (`pack__entry`, never `pack/entry`) if sources are stored as flat files.
- **Pipeline caches**: write atomically (temp + rename) and validate the header on load. A torn cache blob can crash the GPU driver at launch.
- **Concurrent compile bursts** at startup: shader caches must be concurrent maps if the render thread reads while compile threads write.
- **Metal**: if the host injects the uniform struct and vertex output, user files must not redeclare them; say so in the import error.
- **Y-flip**: Metal/Vulkan uv (0,0) top-left vs GL bottom-left. Normalize in the preamble so snippets never care.
- Every audio-driven value must also be a plain, keyframable parameter. The shader shouldn't know whether a human or a beat moved it.
