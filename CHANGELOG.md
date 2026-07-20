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
- 2026-07-15 — Month view: an icon-only toggle in the calendar's nav row hides the per-day
  event dots for a clean calendar (daily-note dots stay); persists per month view. Also
  vertically centers the "today" reset button with the nav arrows. Why: users who want a
  plain calendar without the blue event markers. Files:
  `src/svelte/views/MonthView.svelte`, `src/helper/types.ts`, `styles.css`.
- 2026-07-15 — Schedule view redesign: show only the selected day (no scroll into other
  days), drop the redundant day circle that duplicated the header date, and render events
  as cards whose height signals their duration. Overlapping events are grouped — when one
  event time-contains others they are nested inside its box, positioned by start time;
  otherwise they sit side by side. Why: the old view repeated the date and listed events
  as flat rows with no sense of duration or overlap. Files:
  `src/svelte/views/ScheduleView.svelte`,
  `src/svelte/components/ViewSettings.svelte` (Timespan no longer shown for schedule).
- 2026-07-15 — Day header (schedule + timeline): reworked to mirror the month view — the
  date sits on the left with an icon nav (chevron arrows, English "Today", new-event) pushed
  to the right, and a three-dots button collapses the date away leaving just the right-aligned
  nav; persisted per view. Files: `src/svelte/components/DayNavigation.svelte`,
  `src/svelte/views/ScheduleView.svelte`, `src/svelte/views/TimeLineView.svelte`,
  `src/helper/types.ts`.
- 2026-07-15 — Schedule view fixes: taller minimum block/child heights so text no longer
  clips, and an anti-flicker guard so an auto-refresh returning a transient empty list no
  longer blanks the day's events. Month view: English "Today" label and better spacing/
  centering of the dots toggle. Files: `src/svelte/views/ScheduleView.svelte`,
  `src/svelte/views/MonthView.svelte`.
- 2026-07-15 — Follow-up fixes: schedule cards no longer collapse to one uniform height
  (the base block carried a flex basis that overrode its computed height inside the column
  layout); the collapsed-day-header choice now actually persists (it was written to a
  `codeBlockOptions` object that `ViewSettings` had already replaced, so it never reached
  `data.json`); the month dots toggle is relocated into the calendar's own nav row so it
  centers with the arrows; and the day nav controls are background-less with an eye icon
  for collapsing. Files: `src/svelte/views/ScheduleView.svelte`,
  `src/svelte/views/MonthView.svelte`, `src/svelte/components/DayNavigation.svelte`.

- 2026-07-15 — Unified nav bar: the month view now renders the same nav markup as the
  schedule/timeline views (shared styles live in `styles.css`) instead of the
  obsidian-calendar-ui nav, which is hidden. This also drops the fragile DOM-relocation
  action and the CSS text-replacement used to force an English "Today". Schedule view gains
  a clock toggle that hides already-ended events so the current one sits first (persisted),
  and nested children now derive the container's scale from the shortest child, so their
  heights stay truly proportional to duration and fill the container instead of all
  clamping to the same minimum. Files: `src/svelte/views/MonthView.svelte`,
  `src/svelte/views/ScheduleView.svelte`, `src/svelte/components/DayNavigation.svelte`,
  `src/helper/types.ts`, `styles.css`.

## Tooling / setup (non-versioned)

- 2026-07-15 — Build now copies `main.js`/`manifest.json`/`styles.css` into the vault
  plugin dir on `npm run build` (via `scripts/copy-to-vault.mjs` + `.env.local`). Pinned
  all `package.json` dependency versions exactly per the dependency policy. Realigned the
  `.claude/` instructions to the fork's actual doc layout (`documentation/`, root
  `CHANGELOG.md`, `package.json` as dependency source of truth).
