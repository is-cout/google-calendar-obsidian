---
name: git-branch-mismatch
description: This fork is single-branch `master` by design (no Git Flow), matching upstream
metadata:
  type: project
---

This fork uses a single long-lived `master` branch — no `develop`, no `release/*`/`hotfix/*`
branches. Commits land directly on `master`; a release is a version-bump commit on `master`
plus a bare `x.y.z` tag pushed to trigger `.github/workflows/release.yml`.

**Why:** Lucas chose to keep the upstream plugin's simple master-only layout. The `.claude/`
tooling originally came from a Git Flow bootstrap template; the git/release/init-plugin
instructions were rewritten (2026-07-15) to match master-only, so they are now aligned — this
is settled, not a pending mismatch.

**How to apply:** commit to `master`; never invent `develop`/`release` branches. Remotes:
`origin` = is-cout/google-calendar-obsidian, `upstream` = YukiGasai/obsidian-google-calendar.
Push only when Lucas explicitly asks.
