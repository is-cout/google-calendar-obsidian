# Changelog

This fork's running log of what diverged from the upstream
[obsidian-google-calendar](https://github.com/YukiGasai/obsidian-google-calendar).
Format: `YYYY-MM-DD — description. Why. Files touched.`

## 1.11.0

- 2026-07-15 — Multiple connected accounts. Settings now manage a list of accounts
  (add/remove), each with its own refresh token and OAuth client config; calendars are
  fetched from every account and tagged with their owner so event reads/writes use the
  right token. Calendar selection stays per-calendar (blacklist), now shown grouped by
  account. Existing single-account installs are migrated automatically on load. Why:
  users with more than one Google account needed all of them in one vault. Files:
  `src/helper/types.ts`, `src/helper/LocalStorage.ts`, `src/googleApi/GoogleAuth.ts`,
  `src/helper/RequestWrapper.ts`, `src/googleApi/GoogleListCalendars.ts`,
  `src/googleApi/GoogleListEvents.ts`, `src/googleApi/Google{Create,Update,Delete,Get}Event.ts`,
  `src/googleApi/GoogleSwitchCalendar.ts`, `src/view/GoogleCalendarSettingTab.ts`,
  `src/GoogleCalendarPlugin.ts`.
- 2026-07-15 — Month view: add a "Hide dots / Show dots" toggle button that hides the
  per-day event dots for a clean calendar (daily-note dots stay). Persists per month view.
  Why: users who want a plain calendar without the blue event markers. Files:
  `src/svelte/views/MonthView.svelte`, `src/helper/types.ts`, `styles.css`.
- 2026-07-15 — Schedule view redesign: show only the selected day (no scroll into other
  days), drop the redundant day circle that duplicated the header date, render each event
  as a card whose height signals its duration, and lay overlapping events side by side.
  Why: the old view repeated the date and listed events as flat rows with no sense of
  duration or overlap. Files: `src/svelte/views/ScheduleView.svelte`,
  `src/svelte/components/ViewSettings.svelte` (Timespan no longer shown for schedule).

## Tooling / setup (non-versioned)

- 2026-07-15 — Build now copies `main.js`/`manifest.json`/`styles.css` into the vault
  plugin dir on `npm run build` (via `scripts/copy-to-vault.mjs` + `.env.local`). Pinned
  all `package.json` dependency versions exactly per the dependency policy. Realigned the
  `.claude/` instructions to the fork's actual doc layout (`documentation/`, root
  `CHANGELOG.md`, `package.json` as dependency source of truth).
