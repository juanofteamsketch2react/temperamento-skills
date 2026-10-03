---
name: web-app-to-native-wrapper
description: Ship a rich browser app (three.js, Web Audio, AudioWorklet, WebAssembly, workers) as an offline native iOS/iPadOS/Mac app by wrapping it in WKWebView with a custom URL scheme. Use when someone wants to put their web toy/studio/game in the App Store, make a web app work offline, or hits "ES modules / workers / AudioWorklet don't load from file://".
---

# Web app → native app (WKWebView + custom scheme)

The web build stays the source of truth. The native app is a thin shell plus a sync script that turns the deployed `dist/` into an offline, analytics-free `Web/` folder in the bundle.

## Why a custom scheme

Loading `index.html` with `loadFileURL` gives the page a `file://` origin. ES module imports, `new Worker(url)`, `audioWorklet.addModule()`, `fetch()` of `.wasm` and `WebAssembly.instantiateStreaming` all fail or behave differently there. A `WKURLSchemeHandler` serving `app://app/…` gives the page a real origin, real MIME types and a secure context — it behaves like it does on a web server.

## Steps

1. **Scheme handler** (`examples/BundleSchemeHandler.swift`): map `app://app/<path>` → `Bundle.main.resourceURL/Web/<path>`.
   - Standardize the path and require it to stay under the `Web/` root (no `../` escapes). 404 otherwise.
   - Set `Content-Type` per extension. `.js/.mjs` must be `text/javascript`, `.wasm` must be `application/wasm`, `.glb` `model/gltf-binary`. Wrong MIME = silent module load failure.
2. **Web view config**: `setURLSchemeHandler(_, forURLScheme:)` *before* creating the WKWebView; `allowsInlineMediaPlayback = true`; `mediaTypesRequiringUserActionForPlayback = []`; disable scroll/bounce for app-like UIs; `isInspectable = true` in DEBUG so Safari's Web Inspector attaches.
3. **Bootstrap script** at `.atDocumentStart`: set `window.IS_APP = true` so the page can hide web-only UI (install banners, "get the app" links), set `navigator.audioSession.type = 'playback'` when available so the mute switch doesn't silence it.
4. **Sync script** (`examples/sync-web.mjs`): copy `dist/` → `Web/`, then rewrite `index.html`:
   - strip analytics tags,
   - swap CDN URLs (three.js import map, Google Fonts) for vendored copies under `Web/vendor/`,
   - **every swap throws if its pattern is not found** — a silent miss ships an app that needs the network,
   - finally list any `https://` URLs still left and print the folder size.
5. **Bridges** (optional): Web MIDI isn't in WKWebView. Polyfill `navigator.requestMIDIAccess` in the bootstrap script and feed it from CoreMIDI via `evaluateJavaScript`. Same pattern for haptics, share sheets, StoreKit: `webkit.messageHandlers.<name>.postMessage` one way, `evaluateJavaScript` back.
6. **Console bridge in DEBUG**: patch `console.log/warn/error` + `error`/`unhandledrejection` listeners to post to a `log` message handler and print with `os_log`. You now see page errors in Xcode / `xcrun simctl spawn booted log stream`.
7. **Project**: generate with XcodeGen (`project.yml`), add `Web/` as a *folder reference* (blue folder) so the tree is copied as-is.

## Gotchas

- `AVAudioSession` is iOS-only behaviour; on Mac Catalyst some session calls can hang. Guard with `#if !targetEnvironment(macCatalyst)`.
- AudioContext still needs a user gesture to start; keep a visible Start button.
- WKWebView caches aggressively: send `Cache-Control: no-cache` from the scheme handler during development.
- Big assets: `Data(contentsOf:)` reads the whole file. Fine up to tens of MB; stream with `didReceive` chunks above that.
- App Review: a wrapped website gets rejected under 4.2 (minimum functionality) if it's just a site. Ship offline, native bridges (MIDI, audio session, haptics) and no web-only chrome.
- A test hook that auto-starts the app (`-autostart` launch argument, DEBUG only) is worth having — and mute the master in it.
