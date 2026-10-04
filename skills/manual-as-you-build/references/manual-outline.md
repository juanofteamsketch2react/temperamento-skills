# Manual outline, with prompts for the agent

Copy into the repo as `docs/manual-outline.md` and keep it in sync with `one-pager/manual.html`.

## 0. Header
`MANUAL · v<app version>` · one line: "Everything <App> does, and how to drive it."

## 1. What <App> is
> Read the app's main view and its model. Write one paragraph a musician/designer would understand, then 3–4 bullets with the mental model (what goes in, what comes out, what is live).

## 2. Your first <result>
> Write four numbered steps from launch to the first good result. Each step: a short title and two sentences. Mention the standalone and the plug-in paths where they differ.

## 3. Chapters, in on-screen order
For each panel:
> List every control in <file/view>. For each: label exactly as in the UI, range and default from the code, what it does to the output, one tip. Use a table when there are more than four controls.

Typical chapters for an instrument: source/oscillator · filter · envelopes · modulation · effects · performance controls · sequencer/arp · song mode · volume and limiter.

## 4. Workflows
> Write the recipe for <job> in each host we support (Logic Pro, GarageBand, AUM, Loopy Pro, Ableton Live). Start with the one rule that explains all of them, then the per-host steps.

## 5. Library
Presets (save, export, import, delete) · projects · iCloud sync · packs.

## 6. Integrations
> List every MIDI-learnable control. List every MCP tool with its arguments and one example call. Document Ableton Link behaviour (tempo, phase, start/stop).

## 7. Specs
Platforms and minimum OS · plug-in types and codes · formats in/out · limits (voices, frames, steps) · sample rates.

## 8. Good habits
> From the factory presets and what we learned building the app, write 4–8 tips: one bold sentence plus one line why.

## Release checklist
- [ ] Version stamp matches the build
- [ ] Every control in the UI appears in the manual (ask the agent to diff code vs manual)
- [ ] Nothing documented that was removed or isn't shipped
- [ ] Numbers (counts, ranges, defaults) match the code
- [ ] Screenshots are current
- [ ] Release notes page updated from the git log
- [ ] Read on a phone
