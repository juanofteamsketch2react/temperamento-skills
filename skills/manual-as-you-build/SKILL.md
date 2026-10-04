---
name: manual-as-you-build
description: Build the product's one-page website and a thorough user manual at the same time as the app, in the same repo and the same commits, so every feature ships documented. Use when starting or growing any app, plugin or instrument, when adding a feature, before a release, or when someone asks for a landing page, user manual, docs, help page, release notes or privacy page.
---

# Manual as you build

The one-pager and the manual are part of the product, not a chore after it. Write them with the agent while the code is fresh, in the same repo, and keep them in step with every feature.

## Why it pays off

- **The manual is a design review.** Explaining a control in one honest sentence exposes the confusing ones. If a section is hard to write, the feature is hard to use: fix the feature, not the prose.
- **The agent knows the code right now.** Every parameter, range, default and shortcut is in context while the feature is being built. A week later that knowledge has to be dug back up.
- **It sells.** A thorough manual tells buyers the product is deep and cared for. Reviewers, App Review and support all lean on it.
- **It answers support before it arrives.** The "good habits" and workflow recipes are the questions users would have emailed.
- **Agents can read it too.** A complete manual (plus an `llms.txt`) lets other people's agents drive the product correctly.

## The workflow

1. **Day one:** create `one-pager/index.html`, `one-pager/manual.html`, `one-pager/privacy.html` in the app's repo, sharing one stylesheet and the app's own colors and type. Rough is fine; existing is the point.
2. **Every feature commit includes its manual section.** Same commit, same review. A feature isn't done until its section is written. Ask the agent: "add/update the manual section for what we just built: every control, its range and default, what it does to the result, and one tip".
3. **Write from the code, not from memory.** The agent reads the actual parameter definitions, enums and defaults and documents those. Numbers in the manual must match the code (33 palettes, 26 modifiers, 8 FX stages...).
4. **Version the manual with the app.** Show `MANUAL · v1.6` at the top and bump it with each release. Release notes get their own page, written per build from the git log.
5. **Before each release:** have the agent diff the manual against the code: list controls that exist but aren't documented, and documented things that no longer exist. Fix both.
6. **Proofread on a phone.** Many readers open the manual on the same device as the app.

## Manual structure (in this order)

1. **What it is** – one paragraph, then the mental model in 3–4 bullets.
2. **Your first [patch / beat / scene]** – four numbered steps from opening the app to the first good result. Under a minute of reading.
3. **One chapter per area of the UI, in the order it appears on screen.** For each control: what it is, range/default, what it does to the output, and a tip.
4. **Workflows** – the real jobs: recording into a DAW, exporting, syncing. Host-by-host recipes (Logic, AUM, GarageBand...) and the one rule underneath them.
5. **Library** – presets, projects, import/export, iCloud.
6. **Integrations** – MIDI learn (what's learnable), Ableton Link, MCP tools (list every tool), file formats.
7. **Specs** – platforms, formats, limits, numbers.
8. **Good habits** – 4–8 short tips experts wish they'd known on day one.

See `references/manual-outline.md` for the outline with prompts for each part, and `examples/manual-template.html` for a dependency-free page with a sticky table of contents, numbered steps, callouts and a mobile menu.

## The one-pager

Hero (name, one-line promise, store button, a real screenshot or the release film) → 3–5 feature rows with real screenshots → facts grid (MIDI, offline, no tracking, platforms) → links to the manual, release notes, privacy and sibling apps. See the `ship-it-app-store` skill for store assets.

## Rules

- Real screenshots and recordings from the app, never mock-ups.
- Name things exactly as the UI does, in the same case.
- One idea per paragraph; tables for parameters; numbered steps for procedures.
- Don't document what doesn't ship yet. Mark betas as beta.
- Keep pages static (one HTML file each, no framework) so they load anywhere and last.
