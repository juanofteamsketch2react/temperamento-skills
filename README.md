# Temperamento skills

Things I learned building creative apps with coding agents (VKO1, MESA, FUJI Drum, DUNA, plugins for After Effects, Final Cut, Premiere and Blender, Studio '86, and the release films), written up as agent skills.

Each folder in `skills/` has a `SKILL.md` (frontmatter + method + gotchas) and, for most skills, working example code. They describe methods. None of them contains the apps' source code.

| Skill | What it unlocks |
|---|---|
| `procedural-release-film` | Trailers rendered from code, locked to a score |
| `one-shader-many-hosts` | One GLSL corpus → Metal, Vulkan, WebGL, video plugins |
| `images-into-sound` | Wavetables, drum kits and spectral resynthesis from pictures |
| `audio-reactive-visuals` | FFT, spectral-flux beats, energy; real-time and offline |
| `web-app-to-native-wrapper` | three.js/Web Audio site → offline iOS/Mac app |
| `browser-studio-threejs-webaudio` | Blender-scripted 3D room + AudioWorklet instruments |
| `auv3-instrument-patterns` | Synths, drum machines and MIDI tools for iOS hosts |
| `sibling-app-code-sharing` | Grow app #2 from app #1: vendor, diff, stage |
| `ship-it-app-store` | Preview videos, TestFlight notes, one-pagers |
| `house-rules` | House rules for CLAUDE.md / AGENTS.md |

## Install

Claude Code:

```bash
cp -r skills/procedural-release-film ~/.claude/skills/
```

Other agents: put the folder wherever your agent reads skills, or paste `SKILL.md` into your prompt or `AGENTS.md`.

## License

MIT for the skills and their example code. The Temperamento, VKO1, MESA, FUJI Drum, DUNA and Studio '86 names, the app icons, the release-video clips and any images are © Temperamento, all rights reserved. See `LICENSE`.

The page: https://temperamento.net/skills/
