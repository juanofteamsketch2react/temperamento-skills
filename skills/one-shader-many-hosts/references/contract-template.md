# Shader contract — template

Copy, rename `fx_` to your prefix, fill the table. This file is the API.

## Entry point

```glsl
vec4 fx_main(vec2 uv);   // uv: 0..1, (0,0) = bottom-left on every backend
```

No `#version`, `precision`, `in`/`out`, `layout`, `main()`. Return premultiplied or straight alpha — pick one and write it here.

## Uniforms (`U.*`)

| Field | Type | Range | Meaning |
|---|---|---|---|
| `time` | float | 0 → ∞ s | clock; multiply by `speed` for tempo-locked motion |
| `resolution` | vec2 | px | output size; aspect = x / y (guard y > 0) |
| `speed` | float | 0.1 – 4 | user rate |
| `energy` | float | 0 – 1 | broadband loudness, smoothed |
| `beatPhase` | float | 0 – 1 | resets on each beat |
| `beatStrength` | float | 0 – 1 | onset power, decays |
| `palette` | int | 0 – N-1 | index into `palette()` presets |
| `p0`–`p3` | float | 0 – 1 | free knobs, shader-defined |

## Helpers in the preamble

```glsl
vec3 cosine_palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) { return a + b * cos(6.2831853 * (c * t + d)); }
vec3 palette(float t, int i);   // switch over N presets
```

## Packs

- One folder per pack, one `<id>.glsl` per shader, a `pack.json` with `{ id, name, shaders: [{ id, name, defaults }] }`.
- Keys are `pack__id`. Display names are human names, never prefixed.

## Reserved words (do not use as identifiers)

active common partition input output filter sizeof cast namespace using this class enum union typedef template goto inline public static extern interface long short half fixed unsigned superp resource
