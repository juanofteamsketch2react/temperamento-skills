---
name: house-rules
description: Working rules for building ambitious creative software with a coding agent — think first, keep it simple, change only what's needed, loop toward checkable goals, render proof instead of guessing, keep the ethos of "nothing faked". Use at the start of any creative-app project, or paste into CLAUDE.md / AGENTS.md as house rules.
---

# House rules for creative work with agents

Eight rules that let one person build a VJ app, a synth, a drum machine, video plugins and a 3D browser studio with coding agents.

## 1. Think before coding
State assumptions. If there are two readings of the request, say both. If something simpler exists, say so. If confused, stop and ask — a question costs seconds, a wrong build costs an afternoon.

## 2. Simplicity first
Minimum code that solves the problem. No features nobody asked for, no abstractions for one caller, no config for hypotheticals. If 200 lines could be 50, rewrite it. Few comments — the code and the commit say the rest.

## 3. Surgical changes
Touch only what the task needs. Match the style that's there. Clean up your own orphans; mention other dead code, don't delete it. Every changed line should trace to the request.

## 4. Goal-driven loops
Turn every task into something checkable: a test that fails then passes, a CLI that prints `compiled 60 · failed 0`, a still frame, an `ffprobe` line, a `diff` with empty output. Then loop until it's true.

## 5. Proof over opinion
For creative work, the check is a render. Write tools that render stills, contact sheets, audio phrases and thumbnails from the real engine, and look at them. Agents can see images — make them look.

## 6. Nothing faked
Use the product's own engine for its demo, its film, its website and its sounds. One corpus (shaders) feeds many forms (visuals, wavetables, drum kits, plugins, films). Authenticity compounds; mock-ups don't.

## 7. One idea, many hosts
Make the core host-agnostic early. Each new platform is then a thin shell, and each new app starts from the last one (copy, diff, ship).

## 8. Ship small, ship often
TestFlight every few days. A one-pager per app. A release film per release. Momentum is a feature.
