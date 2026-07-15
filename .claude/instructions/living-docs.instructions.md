---
applyTo: '**'
---

Docs are a living part of this project, not a one-time deliverable.

## Rule

Every significant change to the project ships its documentation update in the same change — never as a follow-up, never silently skipped.

"Significant" means: new/removed feature, event/note file format change, dependency change (version bump, new/removed package), settings/defaults change, build process change, or any change a user or contributor would need to know about to not be surprised.

## What to update

This is a fork of the upstream `obsidian-google-calendar` plugin. Its docs are the
existing artifacts — there is no separate internal `docs/` skeleton. Check each of these
against your change before calling a task done:

1. **[CHANGELOG.md](../../CHANGELOG.md)** — add a dated entry (`YYYY-MM-DD — description. Why. Files touched.`) for every significant change. This is the fork's running log of what diverged from upstream. If the file does not exist yet, create it at the repo root when you make your first significant change.
2. **[README.md](../../README.md)** — update if the change affects the feature list, installation, usage, or the project description.
3. **[documentation/content/](../../documentation/content/)** — the user-facing Quartz docs site (settings pages, commands, examples). Update the relevant page if the change affects a documented setting, command, or view behavior.
4. **[package.json](../../package.json)** — is itself the dependency source of truth (versions are pinned exactly). Reflect any dependency add/remove/version change there; there is no separate DEPENDENCIES.md.

Not every change touches every doc — but check each one against the list above before calling a task done.

**Why:** stale docs are worse than no docs; they actively mislead. This project's README/docs are meant to be trustworthy enough that a new contributor (or future Claude session) can rely on them instead of re-deriving everything from the source.

**How to apply:** treat "update the docs" as part of the task's definition of done, not an optional nice-to-have. If a change is ambiguous about whether it's "significant," err toward documenting it — a short changelog line costs little.
