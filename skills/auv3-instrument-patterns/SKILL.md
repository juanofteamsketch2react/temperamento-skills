---
name: auv3-instrument-patterns
description: Architecture and gotchas for building music instruments as AUv3 plugins plus standalone apps on iOS, iPadOS and Mac — C++ real-time DSP core, Objective-C++ bridge, Swift/SwiftUI/Metal UI, MIDI processors, host sync, MIDI learn, Ableton Link. Use when building a synth, drum machine, effect or MIDI tool for AUM, Loopy Pro, GarageBand, Logic or any AUv3 host.
---

# AUv3 instrument patterns

## Layout

```
DSPCore/   pure C++17, header-only, real-time safe, unit-tested, no Apple headers
AUv3/      AUAudioUnit subclass (ObjC++), parameter tree, view controller, Metal views
App/       standalone container: AVAudioEngine host, CoreMIDI, on-screen keys
project.yml  XcodeGen: app target embeds the extension; Mac via Catalyst
```

- The **DSPCore** is the product. Because it's plain C++ it also compiles to WebAssembly (browser demo) and links into CLI tools (render a song offline for a film).
- The **standalone app** hosts its own extension in-process so app and plugin always sound identical.
- Mac: Mac Catalyst ("Optimized for Mac") gives you a Mac app from the same target.

## Real-time rules (the render block)

- No allocation, no locks, no Objective-C/Swift messaging, no file I/O on the audio thread.
- UI → DSP: parameters via the `AUParameterTree` (atomic values), bigger data (wavetables, patterns, curves) via a **double-buffered snapshot** swapped with an atomic pointer. The render thread never touches Swift objects.
- DSP → UI (meters, playheads, telemetry for visuals): atomics or a lock-free ring buffer, polled from a display link.
- Heavy work (building wavetables, FFT mip banks, kits) on a background queue; swap when done; show a "building" badge.

## Instruments vs MIDI processors

- `aumu` instrument, `aufx` effect, `aumi` MIDI processor.
- An AUv3 **cannot reach into another plugin's parameters** (each is sandboxed in its own process). To automate other plugins, be an `aumi` and send **CC / pitch bend** that the host routes and the target MIDI-learns. Works with every plugin, every host, and hardware.
- 7-bit CC steps audibly on slow sweeps. Offer CC14 (MSB/LSB on n and n+32) and pitch bend (natively 14-bit) as hi-res modes; dedupe repeated values and rate-cap.
- Default CCs from the undefined ranges (102–119, then 20–31) so you don't collide with factory maps.

## Sync

- Read the host's **musical context and transport state** (beat position, tempo, isPlaying) every render cycle.
- Loop-locked behaviour: derive phase from the host beat position, so everything is in sync with nothing of your own to start.
- Host stopped → park and stay silent (release held notes, never leave them hanging). Restart → restart from the host's bar.
- No transport (standalone, some hosts) → run your own clock. Offer Ableton Link (LinkKit is App Store-safe) for the standalone.

## UX that musicians expect

- **MIDI learn** on every control (right-click / long-press → move a knob), bindings persisted.
- Factory presets + user presets; a **dice** that rolls musically sane patches.
- Landscape-first on iPhone; compact layouts for AUM's small plugin window.

## Ship checklist

- Launch the standalone once on a device so the extension registers before testing in hosts.
- Validate: `auval -v aumu <subtype> <manufacturer>` on Mac.
- Test in AUM, Loopy Pro, GarageBand and Logic (Mac). State save/restore in each (`fullState`).
- First device build with App Groups/iCloud: `xcodebuild … -allowProvisioningUpdates` to register the App IDs.
- Never rename bundle IDs or AU codes after release (see `sibling-app-code-sharing`).
