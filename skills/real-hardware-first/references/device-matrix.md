# Device matrix (template)

Copy into the repo as `docs/device-matrix.md`. Tick per release; the agent fills in what changed and what each row must re-check.

## Devices

| Device | OS | Why it's here | Last checked (build) |
|---|---|---|---|
| Oldest supported iPhone | oldest supported iOS | slowest CPU/GPU, smallest screen | |
| Current iPhone | latest iOS | notch, ProMotion, newest APIs | |
| iPad | latest iPadOS | layout, Stage Manager, pointer, keyboard | |
| Mac (Catalyst / native) | latest macOS | menus, entitlements, window sizes | |
| Android, Mali GPU | oldest supported | driver quirks, low memory | |
| Android, Adreno GPU | latest | vendor differences, high refresh | |

## Audio routes
- [ ] Built-in speaker
- [ ] Wired headphones (plug and unplug mid-playback)
- [ ] Bluetooth headphones / speaker (connect mid-playback)
- [ ] USB audio interface (sample-rate change)
- [ ] Interruption: phone call, alarm, Siri

## Inputs
- [ ] Touch (fingers, not a mouse)
- [ ] Hardware keyboard
- [ ] MIDI keyboard / pad controller (notes, CCs, pitch bend)
- [ ] Game controller
- [ ] Mouse / trackpad on iPad

## Hosts (plugins)
- [ ] Logic Pro · GarageBand (Mac / iOS)
- [ ] AUM · Loopy Pro (iOS)
- [ ] After Effects · Final Cut Pro / Motion · Premiere · Blender (the versions you claim)
- [ ] Save, close, reopen: state restored

## Conditions
- [ ] 30 minutes continuous use (thermal, memory)
- [ ] Airplane mode / offline
- [ ] First install, and upgrade over the previous build with real data
- [ ] External display / AirPlay / HDMI
- [ ] Low storage

## Per-build hands-on script (agent writes, human runs, about 10 minutes)
1. What changed in this build (from the git log).
2. For each change: device, steps, what you should see and hear.
3. One regression pass on the core flow.
4. Report: device model, OS, pass/fail, screenshot or recording of any failure.
