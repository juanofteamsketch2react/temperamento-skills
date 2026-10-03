---
name: ship-it-app-store
description: The last mile for indie creative apps on Apple platforms — App Store preview videos that pass Apple's spec, screenshots, TestFlight notes that don't get mangled, a one-page product site with privacy page, naming and listing rules. Use when preparing an App Store or TestFlight release, encoding app previews, or making a landing page for an app.
---

# Ship it: App Store last mile

## Preview videos

Apple rejects previews silently-ish ("couldn't process"). This recipe passes:

```bash
ffmpeg -y -i in.mov \
  -c:v libx264 -profile:v high -level 4.0 -pix_fmt yuv420p \
  -vf "scale=W:H:force_original_aspect_ratio=disable,setsar=1:1" -r 30 \
  -b:v 10M -maxrate 12M -bufsize 12M \
  -c:a aac -b:a 256k -ar 48000 -ac 2 \
  -movflags +faststart out.mp4
```

| Device | W × H |
|---|---|
| iPhone (portrait, 6.9"/6.7") | 886 × 1920 |
| iPad (landscape) | 1600 × 1200 |
| Mac | 1920 × 1080 |

- 15–30 s, ≤ 30 fps, **must have an audio track** (silent AAC is fine).
- Verify: `ffprobe -v error -select_streams v:0 -show_entries stream=level,profile,width,height,r_frame_rate -of csv=p=0 out.mp4` → `High,40,…`.
- Render the film at the target aspect (see `procedural-release-film`) — don't letterbox. `examples/encode-preview.sh` wraps this with a level check.

## TestFlight & release notes

- **Plain ASCII only.** App Store Connect mangles em dashes, curly quotes and some emoji in "What to Test". Use `-`, `'`, `"`.
- "What to Test" ≤ 4000 characters. Write it per build from the git log since the last build — never from memory.
- Lead with what to try, then what changed, then known issues.

## Listing

- Name ≤ 30 chars, subtitle ≤ 30. If the name is taken, the listing name and the bundle display name don't have to match ("App" in the store, "App" on the home screen).
- Never rename bundle IDs / App Groups / AU codes after release; change the display name only.
- Screenshots from the real app (simulator + `xcrun simctl io booted screenshot`), a caption band on top is enough.
- Privacy "Data Not Collected" is a selling point for creative tools. Earn it: no analytics SDKs in the app.

## The one-pager

Each app gets `one-pager/index.html` + `privacy.html` (+ `manual.html` if it's an instrument): static, one file each, fonts from Google Fonts, no framework.
- Hero: name, one-line promise, App Store button, a looping muted film or a real screenshot.
- 3–5 feature rows: a real screenshot + 2 sentences each.
- Facts grid (MIDI, offline, no tracking, platforms).
- Cross-links to sibling apps — a family sells better than a single app.
- OG image 1200×630, `theme-color`, apple-touch-icon.
- Privacy page: what's collected (ideally nothing), where data lives, contact email.
