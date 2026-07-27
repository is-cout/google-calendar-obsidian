# Changelog

This fork's running log of what diverged from the upstream
[obsidian-google-calendar](https://github.com/YukiGasai/obsidian-google-calendar).
Format: `YYYY-MM-DD — description. Why. Files touched.`

## 1.15.0

- 2026-07-27 — Fix right-clicking a timeline event opening the event details modal.
  `MouseControll` started its drag/click flow on any mouse button, so the right button also
  ran `onDragClick`. It now ignores everything but the left button, leaving the context menu
  to the time block popup. Files: `src/svelte/components/MouseControll.svelte`.
- 2026-07-27 — Read the event color list from the Google colors endpoint instead of the
  hardcoded table, so colors Google adds show up in the tag editor. The table stays as the
  offline fallback, and color lookups no longer index blindly (an unknown `colorId` used to
  throw in `getColorFromEvent`). Files: `src/googleApi/GoogleColors.ts`
  (`getEventColorOptions`, `loadEventColorOptions`), `src/modal/ManageTimeBlockTagsModal.ts`,
  `src/view/GoogleCalendarSettingTab.ts`.
- 2026-07-27 — The auto build fill window moves in half hours instead of whole hours, since
  a day rarely starts on the hour. The setting stores fractional hours (5.5) and is applied
  in minutes, and it is picked from clock time dropdowns (`05:30`, `06:00`, …) instead of
  sliders, which could only render the value as "5.5". Files:
  `src/helper/TimeBlockPlanner.ts`, `src/view/GoogleCalendarSettingTab.ts`.
- 2026-07-27 — Multi day events keep counting as busy. `googleListEvents` resolves an event
  spanning several days into one 00:00-23:59 piece per day, which makes every day it covers
  unfillable — a vacation event was why auto build produced nothing. Blanket-skipping those
  was considered and rejected: a multi day event genuinely can be busy time, so this stays
  the user's call through the fill ignore patterns. The debug log names the event, which is
  what actually makes it findable. Files: `src/helper/TimeBlockPlanner.ts`.
- 2026-07-27 — Auto build no longer counts events shown as "Free" (`transparency:
  transparent`) or invites the user declined as busy time, matching how Google's own
  free/busy view reads a calendar. A work calendar full of declined invites and background
  "Free" events left literally no gap to fill. The per-day debug log now prints one flat
  line per timed event with why it was kept or skipped (`BUSY` / `SKIP shown as free` /
  `SKIP declined` / `SKIP fill ignore pattern`), since the console collapses arrays. Files:
  `src/helper/TimeBlockPlanner.ts` (`occupiesTime`), `src/helper/TimeBlockBuilder.ts`.
- 2026-07-27 — Make auto build diagnosable: it logs the fill window, every busy slot with its
  title and the resulting gaps per day in debug mode, warns when creating a block fails, and
  the command says "no free space left" instead of "created 0" when the window is full. The
  planning math moved to `TimeBlockPlanner.ts`, which has no plugin or Obsidian imports, so
  it can be checked in isolation — verified against 15 scenarios (empty day, overlapping
  events, all-day events, window clipping to now, ignore patterns, leftover absorption).
  Files: `src/helper/TimeBlockPlanner.ts` (new), `src/helper/TimeBlockBuilder.ts`,
  `src/GoogleCalendarPlugin.ts`.
- 2026-07-27 — Stop auto build treating events hidden by the plugin-wide `ignorePatternList`
  as free time. That list is about what the views display; an event it hides still occupies
  the slot in Google Calendar, and only the time block fill ignore patterns may free a slot
  up. `googleListEvents` grew an `applyIgnorePatterns` option (default true) which also
  bypasses the event cache, since the cache stores the filtered list. Same fix for the
  delete command, so a hidden time block stays deletable. Files:
  `src/googleApi/GoogleListEvents.ts`, `src/helper/types.ts` (`ListOptions`),
  `src/helper/TimeBlockBuilder.ts`.
- 2026-07-27 — Add auto build for time blocks, so the placeholder events don't have to be
  created by hand. `Auto Build gCal Time Blocks` scans the free space of each day in the
  horizon and fills it with individual placeholder events; `Delete All gCal Time Blocks`
  removes the untagged ones again after a confirmation, which is the undo for a bad fill.
  New settings: fill window (start/end hour), block duration (default 30 min), days to fill,
  a separate regex ignore list whose matches don't count as busy (kept apart from the
  plugin-wide `ignorePatternList`, which has a different job), and smart fill — block length
  derived from the time of day (90 min in the late-morning focus peak, 30 min in the
  post-lunch dip) following the ultradian rhythm. Files: `src/helper/TimeBlockBuilder.ts`
  (new), `src/modal/ConfirmDeleteTimeBlocksModal.ts` (new), `src/helper/types.ts`,
  `src/GoogleCalendarPlugin.ts`, `src/view/GoogleCalendarSettingTab.ts`,
  `documentation/content/TimeBlocking.md`, `documentation/content/Commands.md`.

## 1.14.0

- 2026-07-27 — Add time blocking. Generic placeholder events (title configurable, default
  `Time blocking`) can be tagged from the timeline and schedule views: right-click an event
  to open a tag picker, applying a tag renames the event, sets its Google event color and
  writes the tag's optional description. Right-clicking an event that is *not* a placeholder
  offers to convert it into one first (configured name + color), then shows the picker — this
  doubles as the way to re-tag an already tagged event. Tags (name + color + optional
  description) are edited in the settings tab or via the new `Manage gCal Time Block Tags`
  command, and live in the plugin settings only. Files: `src/helper/types.ts` (new
  `TimeBlockTag`, three settings), `src/helper/TimeBlockHelper.ts` (new),
  `src/modal/TimeBlockModal.ts` (new), `src/modal/ManageTimeBlockTagsModal.ts` (new),
  `src/googleApi/GoogleColors.ts` (`eventColorOptions`, `getHexFromEventColorId`),
  `src/GoogleCalendarPlugin.ts` (defaults + command),
  `src/view/GoogleCalendarSettingTab.ts`, `src/svelte/views/ScheduleView.svelte`,
  `src/svelte/components/EventBox.svelte`, `styles.css`,
  `documentation/content/TimeBlocking.md` (new), `documentation/content/Commands.md`,
  `README.md`.

## 1.13.0

- 2026-07-21 — Show the current time on the left of the schedule view nav bar while the date
  header is collapsed. The collapsed header left that space empty and dropped the only time
  reference from the view. Uses the same `now` moment refreshed on every 5s poll and the
  view's hour format. Files: `src/svelte/components/DayNavigation.svelte` (new
  `compact-left` slot), `src/svelte/views/ScheduleView.svelte`.

## 1.12.1

- 2026-07-21 — Fix the real cause of schedule view events disappearing and reappearing.
  `moment` mutates in place, and `googleListEvents` normalised its arguments with
  `startDate.startOf("day")` / `endDate.endOf("day")` directly. The schedule view passes the
  *same* moment as both bounds (`{startDate: date, endDate: date}`), so the second call
  mutated the object the first had already set, collapsing the request to a zero-width range
  (`timeMin === timeMax`) and returning almost no events. The view then oscillated — e.g.
  20 events when the shared day cache had been filled by another view's correct wide-range
  request, 3 when the cache expired and the schedule issued its own broken one. The timeline
  view never showed this because it passes a clone as its end date. `googleListEvents` now
  clones both bounds before normalising, which also stops it mutating callers' date state.
  Removes the same-day empty-result guard added while chasing the wrong cause (it wrongly
  kept showing the last event of a day after it was deleted); the keyed `{#each}` blocks and
  the fetch-failure/`loading` try/finally handling are kept, and debug-mode logging of the
  refresh cycle stays in. Files: `src/googleApi/GoogleListEvents.ts`,
  `src/svelte/views/ScheduleView.svelte`.

## 1.12.0

- 2026-07-20 — Add a status dot to the right of schedule-view event cards showing how
  imminent each event is: green = happening now (start ≤ now ≤ end), orange = starts within
  30 minutes, red = starts further out, no dot once the event has ended. Applies to standalone,
  container, and side-by-side cards (not all-day chips or nested children). Why: quick at-a-glance
  read of what's up next. Files: `src/svelte/views/ScheduleView.svelte`.

## 1.11.1

- 2026-07-20 — Fix schedule view events flashing away and reappearing on auto-refresh
  (and, transiently, vanishing entirely). Root cause: `listEvents` returns `[]` for both a
  genuinely empty day and a *failed* fetch (401 during a token refresh, a network blip, one
  calendar erroring), so the 5s auto-refresh could momentarily render an empty list on a
  transient failure and then restore the events on the next successful poll. The view now
  fetches via `googleListEvents` (which throws) inside a try/catch, so a failed fetch keeps
  the events already on screen and only a successful fetch replaces the list (a real empty
  day still shows "No events"). Also wraps the fetch in try/finally so `loading` can never
  get stuck `true` and permanently block refreshes. Additionally, a *successful* fetch can
  still return `[]` transiently (Google's list API occasionally responds empty right after
  a token refresh / due to eventual consistency), and when the Obsidian window is unfocused
  the Electron refresh timer is throttled and fires in a burst on refocus — several empty
  results can land at once. Unlike the timeline view (which draws events over a static
  hour grid, so a momentary empty is invisible), the schedule view swaps its whole body to
  a "No events" message, making any empty blip a visible flash. The view now trusts an
  empty result only on an actual day change: any same-day re-fetch — the 5s poll, a
  settings toggle re-running the reactive block, or an edit callback — never blanks a
  populated list, tracked via a `loadedDayKey`. Files: `src/svelte/views/ScheduleView.svelte`.
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

- 2026-07-15 — Revert the month view's nav to the small icon-only dots toggle relocated into
  obsidian-calendar-ui's own nav row, undoing the full custom nav rebuild from the previous
  change (it looked worse in practice). Schedule/timeline nav, the hide-past-events toggle,
  and the nested-event height fixes are unaffected. Files: `src/svelte/views/MonthView.svelte`,
  `styles.css`.

- 2026-07-15 — Schedule/timeline nav buttons still showed Obsidian's default raised-button
  background/box-shadow because that base styling out-specifies a plain class selector.
  Added `!important` overrides (including `:hover`/`:focus`) so the icon nav is truly
  background-less, matching the month view. Files: `styles.css`.

## Tooling / setup (non-versioned)

- 2026-07-27 — Rewrite the README so it states up front that this is a fork of
  `YukiGasai/obsidian-google-calendar` (stale upstream), splits the feature list into
  inherited vs. fork additions, and documents manual installation from this fork's releases.
  The old README read as if it were the upstream project. Files: `README.md`.
- 2026-07-15 — Build now copies `main.js`/`manifest.json`/`styles.css` into the vault
  plugin dir on `npm run build` (via `scripts/copy-to-vault.mjs` + `.env.local`). Pinned
  all `package.json` dependency versions exactly per the dependency policy. Realigned the
  `.claude/` instructions to the fork's actual doc layout (`documentation/`, root
  `CHANGELOG.md`, `package.json` as dependency source of truth).
