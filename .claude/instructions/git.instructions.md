---
applyTo: '**'
---

# Git Workflow & Commits

## Branching (single-branch `master`)

This fork keeps the upstream plugin's simple layout: a single long-lived `master` branch.
There is **no** Git Flow, no `develop`, no `release/*`/`hotfix/*` branches.

- `master` — the working and release branch. Commits land here directly. Releases are just a
  version-bump commit on `master` plus a `x.y.z` tag (bare numbers, no `v` prefix).
- Short-lived topic branches are optional (only if Lucas asks to isolate risky work); when
  used they merge back into `master`. The default is to commit straight to `master`.

Releases are **requested, not automatic** — a version bump does not by itself create a
release. A release only happens when explicitly asked for (see below).

## Committing After a Task

Once a requested code change is implemented, verified (typecheck/build), and its docs are
updated, commit it to `master` without waiting for a separate "commit this" prompt. This is a
standing instruction — it overrides the general "never commit unless explicitly asked"
default for this project.

**Do not push anything unless Lucas explicitly says so** (e.g. "pode dar push", "sobe isso").
Committing to `master` is automatic; pushing is not — he may want several commits to
accumulate while he tests before anything goes to the remote.

## Commit Messages (Conventional Commits)

Format: `<type>: <short summary>`

Types:

- `feat:` — new feature or capability.
- `fix:` — bug fix.
- `docs:` — documentation only (README, documentation/, CHANGELOG, instructions/).
- `chore:` — tooling, build config, deps, repo maintenance.
- `refactor:` — code change that neither fixes a bug nor adds a feature.
- `style:` — formatting only, no code meaning change.
- `test:` — adding or fixing tests.
- `ci:` — CI/CD workflow changes.

Rules:

- Summary in imperative mood, lowercase after the colon, no trailing period.
- Keep commits small and scoped to one logical change.
- Body (optional) explains *why*, not *what* — the diff already shows what.
- No Claude/AI co-author trailer in commit messages.

Examples:

```
feat: add sticky note color picker
fix: mic dropdown width mismatch with font dropdown
docs: update changelog for v0.7.1
chore: pin esbuild to 0.28.1
```

## Release Procedure

Releases are **user-requested**, not automatic. When Lucas asks for a release, use the
`release` skill (`.claude/skills/release/`) instead of doing these steps ad hoc — it
encodes the full sequence below.

Follows [Versioning](versioning.instructions.md) for what bumps the version and which files to sync.

The version in `package.json`/`manifest.json`/`versions.json` is already current on `master`
by this point — each `feat`/`fix` bumped it when it shipped (see
[Versioning](versioning.instructions.md)). This procedure just confirms, tags, and publishes it.

1. Confirm the working tree is clean on `master` and `CHANGELOG.md` reflects everything in the release.
2. If a last-minute fix or changelog edit is needed, commit it to `master` first.
3. Tag on `master`: `git tag -a <x.y.z> -m "<x.y.z>"`. **No `v` prefix** — Obsidian requires the
   release tag to match `manifest.json`'s `version` exactly, or the plugin won't install.
4. Push `master` and the tag: `git push origin master <x.y.z>`.

Pushing the `x.y.z` tag triggers the `.github/workflows/release.yml` GitHub Action, which builds the plugin and publishes a GitHub Release containing only `main.js`, `manifest.json`, and `styles.css` (the files a user drops into their vault's plugin folder).
