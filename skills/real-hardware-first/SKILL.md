---
name: real-hardware-first
description: Test every build on real devices and in real hosts, never only in simulators, emulators or previews, and never ship without a round of beta testers: phones, tablets, Macs, low-end Android GPUs, Bluetooth audio, MIDI keyboards, controllers, external displays, plugin hosts. Use when building or releasing any app, plugin, game or instrument, when a bug "can't be reproduced", before TestFlight or store submission, or when an agent says "it works in the simulator".
---

# Real hardware first, then beta testers

The simulator is a fast compiler check. It is not the product. Most of the bugs that would embarrass a release only exist on real hardware, and an agent that can only see the simulator will happily report "done" on a build that is silent, black or crashing on a phone.

## What only shows up on real hardware

All of these passed in the simulator and broke on a device:

| Area | What broke on hardware |
|---|---|
| **Audio** | Standalone app silent on iPhone (audio session category/route). Bluetooth speakers got no audio (route and sample-rate change). Audio engine died when the hardware reconfigured (headphones in/out, interface plugged). Latency and buffer sizes differ per device. |
| **GPU** | Video export came out white on iPhone (pixel format / codec; switched to HEVC). A blend mode broke on Mali GPUs only. Shader caches crashed one vendor's driver. Thermal throttling halves the frame rate after minutes of real use. |
| **Android graphics** | Native crash from destroying the Vulkan device while the system UI still owned the surface. Buffer eviction crashes. A camera/image reader needed more buffers than the emulator ever asked for. |
| **Layout** | iPhone layouts overflowing in landscape while iPad was fine. Notches, home indicators, split view, Stage Manager. Mouse scroll wheels and trackpads on iPad. |
| **Input** | Hardware MIDI keyboards, Bluetooth computer keyboards, game controllers and MIDI controllers (whose factory CCs differ by firmware). Touch gestures fighting a scroll view only on a finger, not a mouse. |
| **Hosts** | An AUv3 that crashed Logic when it showed a share sheet. File panels that crashed a video-editor plugin's XPC service unless opened on the main queue. A Blender add-on crashing during render. An AUv3 that doesn't appear in hosts until the app has been launched once on the device. |
| **Mac Catalyst** | Menus with black labels, missing Photos entitlement, audio-session calls that hang, haptics that don't exist. |
| **Install & OS** | A device install that didn't replace the old build because the build number wasn't bumped. First device build needing provisioning updates for App Groups and iCloud. The oldest supported OS version behaving differently. |
| **External world** | HDMI / external displays, AirPlay, streaming, offline mode, low storage, a cold first launch vs an upgrade with old data. |

## The rules

1. **No feature is done until it has run on real hardware.** The simulator result is a precondition, not the verdict. If the agent hasn't seen device output (logs, a screenshot, a recording, or the human's report), it isn't verified.
2. **Nothing ships before beta testers have used it.** Every release goes through TestFlight / an internal testing track first, to real people on their own devices, in their own hosts, with their own habits. No exceptions for "small" releases.

## The workflow

1. **Keep a device matrix** (`references/device-matrix.md`): the oldest supported phone, a current phone, an iPad, a Mac (Catalyst or native), a low-end and a high-end Android with different GPU vendors, and the hosts, audio routes and inputs your product touches. Not every build needs every row; every release does.
2. **Let the agent drive the device, not just the simulator.** It can build, install, launch and read the console on a plugged-in or networked device (`examples/device-run.sh`):
   - iOS/iPadOS: `xcodebuild … -destination 'platform=iOS,id=<udid>'`, then `xcrun devicectl device install app --device <udid> <App.app>` and `xcrun devicectl device process launch --device <udid> --terminate-existing --console <bundle-id>` to stream the app's output back.
   - Android: `adb install -r app.apk`, `adb logcat` filtered to your tags, `adb shell dumpsys gfxinfo <package>` for frame timing.
   - Mac: run the real binary, and read `~/Library/Logs/DiagnosticReports` after a crash.
3. **Instrument for the device.** A debug-only perf HUD (fps, frame time, GPU/CPU cost, thermal state), a log bridge for web views, and a debug launch argument that puts the app in a known state (and mutes it). These turn "it feels slow" into numbers the agent can read.
4. **Write a 10-minute hands-on script per build.** The agent turns the changes since the last build into a short checklist for a human with the devices: what to tap, what to listen and look for. The human reports back; the agent fixes. Real ears, real fingers, real speakers.
5. **Test the ugly paths on purpose:** Bluetooth headphones connected mid-playback, a phone call interrupting audio, rotating mid-gesture, airplane mode, 30 minutes of continuous use (heat), first install and upgrade over an old build, the oldest OS you support.
6. **Plugins: test in the real hosts,** at least two per format (Logic + GarageBand or AUM + Loopy Pro for AUv3; the real After Effects / Final Cut / Premiere / Blender versions you claim). Save, close and reopen the project to test state restore.
7. **Beta testers, every release.** Build a tester group early (Discord, TestFlight public link, Play internal testing) and keep it warm with a build every few days. Write "What to Test" per build from the git log: what changed, what to try, known issues. Ask for device model, OS, host and a recording with every report. Fix, rebuild, and let testers confirm before you submit to the store.
8. **Promote, don't rebuild.** The build that goes to the store is the exact build the testers approved. A last-minute change means a new beta round.

## Gotchas for agents

- "Build succeeded" and "simulator launched" are not test results. Say which hardware a claim was verified on.
- When a bug report says "on my iPhone", reproduce it on a device before changing code. Simulator reproductions of device bugs are often false.
- Bump the build number for every device install you intend to compare; same-number installs may not replace the app.
- Never play loud test audio on someone's device without warning; mute by default in test modes.
