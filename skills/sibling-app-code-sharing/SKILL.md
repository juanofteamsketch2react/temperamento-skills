---
name: sibling-app-code-sharing
description: Grow a family of apps from one another without a shared library — vendor files verbatim, prove parity with a diff check, stage unported files, keep projects generated (XcodeGen) so copying is cheap. Use when starting app #2 from app #1, sharing a DSP/render core between apps, plugins and tools, or when "the fix landed in one app but not the other".
---

# Sibling apps: share by copying, prove by diffing

A shared package is the textbook answer and often the wrong one for a solo builder moving fast: versioning, release coupling and abstraction for hypothetical callers. The alternative that works: **copy verbatim, then prove the copies are still identical.**

## The pattern

1. **Pick the unit.** A whole file or folder that is already host-agnostic: a header-only C++ DSP core, a shader importer, a theme/controls file, an analysis module.
2. **Vendor it verbatim.** Same file names. Keep the original namespace (`namespace appone`) even in app two, so fixes cherry-pick both ways without edits. Only rename what users can see.
3. **Prove parity with one command**, written in the README:
   ```bash
   diff <(sed 's/AppTwo/AppOne/g;s/APPTWO/APPONE/g' Core/Importer.swift) ../AppOne/Core/Importer.swift
   diff -r Core/DSP ../AppOne/Core/DSP
   ```
   Empty output = in sync. Run it before every release of either app; agents should run it after touching vendored files.
4. **Stage, don't half-port.** Files you copied but haven't adapted go in `Staged/` (not in the build) with a `PORTING.md` table: file → what it needs. The port becomes a diff, not archaeology.
5. **New code lives beside, not inside.** App two's own engine (`PadBank.h`, `StepSequencer.h`) sits next to the vendored core; the vendored files stay untouched.
6. **Generated projects.** Use XcodeGen (`project.yml`) / CMake / Gradle — never hand-edited project files. Adding a vendored folder is one line, and regenerating after adding files is a habit.

## The shell-and-core layout (plugins and hosts)

```
core/      identical in every repo (diff -r proves it)
host/      the only folder that differs: AUv3, standalone, AE plugin, FxPlug, web...
tools/     CLI renderers/tests that link core/ directly
```

The same core can then power: the app, its plugin, a CLI that renders stills for a release film, a WebAssembly build for a browser demo (Emscripten compiles header-only C++ trivially).

## When to stop copying

When three or more repos vendor the same unit *and* it changes weekly, extract a package. Before that, copying + diffing is faster and keeps each app shippable on its own.

## Renaming a shipped app

Change the **display name** only. Bundle IDs, App Group, iCloud container, AU subtype/manufacturer codes and code identifiers keep the old name — renaming them breaks registered IDs, user data and saved host sessions. Write that down in the README so no future agent "cleans it up".
