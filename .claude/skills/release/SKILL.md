---
name: release
description: Ship a plugin release from the single `master` branch — confirm the version is bumped, update the changelog, tag `x.y.z`, and push to trigger the GitHub release build. Use when Lucas explicitly asks for a release (e.g. "faz uma release", "cut a release", "ship v0.8.0").
---

# Release

Ships a new plugin version from this repo's single `master` branch (no Git Flow). Read
[.claude/instructions/git.instructions.md](../../instructions/git.instructions.md) and
[.claude/instructions/versioning.instructions.md](../../instructions/versioning.instructions.md)
first — this skill is the executable form of the "Release Procedure" section in both.

Only run this when the user explicitly asks for a release. A version bump alone is never a
trigger.

## Steps

1. **Confirm working tree is clean and on `master`.**
   `git status` must be clean. Don't discard uncommitted work — commit or ask first.

2. **Determine the version.**
   Ask the user for `x.y.z` if not given, or derive it from
   [Versioning](../../instructions/versioning.instructions.md) rules by reviewing commits
   since the last tag (`git log <last-tag>..master`). State the reasoning (MAJOR/MINOR/PATCH)
   before proceeding.

3. **Ensure the version files are bumped to `x.y.z`** (each `feat`/`fix` should already have
   done this; if not, bump and commit now):
   - `package.json` -> `"version"`
   - `manifest.json` -> `"version"`
   - `versions.json` -> add `"x.y.z": "<minAppVersion>"` if `minAppVersion` changed

4. **Confirm `CHANGELOG.md`** has an entry for this version summarizing the changes since the
   last release (use `git log <last-tag>..master --oneline` for source material). Commit any
   changelog/version edits to `master`: `git commit -m "chore: release <x.y.z>"`.

5. **Tag on `master`** — bare `x.y.z`, **never** a `v` prefix (Obsidian requires the release
   tag to match `manifest.json`'s `version` exactly; the release workflow only triggers on
   `[0-9]+.[0-9]+.[0-9]+`):
   ```
   git tag -a <x.y.z> -m "<x.y.z>"
   ```

6. **Confirm with the user before pushing** (pushing triggers the public GitHub release
   build — the irreversible, visible step). Show what will be pushed: `master` and tag `<x.y.z>`.

7. **Push:**
   ```
   git push origin master <x.y.z>
   ```

8. Report the release: tag pushed, and that
   [.github/workflows/release.yml](../../../.github/workflows/release.yml) will build and
   publish the GitHub Release with `main.js`, `manifest.json`, `styles.css`. Link the
   Actions run if available (`gh run list --workflow=release.yml -L 1`).

## Notes

- This is a hard-to-reverse, publicly-visible action (pushes to `master`, creates a public
  GitHub Release). Always confirm the version number and changelog with the user before
  step 7, per this repo's risk-confirmation policy.
- For an urgent fix to an already-released version, just commit the fix to `master`, bump the
  PATCH version, and run this same flow.
