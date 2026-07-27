# Google Calendar

Manage your Google Calendar from inside Obsidian.

> **This is a fork.** It builds on
> [YukiGasai/obsidian-google-calendar](https://github.com/YukiGasai/obsidian-google-calendar),
> which the original author put in stale mode ("I no longer have/had time to maintain it").
> Everything the original does still works the same way; this fork keeps it alive and adds a
> few things on top (see [Fork additions](#fork-additions)). All credit for the plugin itself
> goes to the upstream author — the original README is kept below, extended.
>
> Fork maintained at [is-cout/google-calendar-obsidian](https://github.com/is-cout/google-calendar-obsidian).
> Issues with fork-only features belong here, not upstream. Releases are published from this
> repository; the plugin is not in the Obsidian community list under this fork, so install it
> manually (see [Installing this fork](#installing-this-fork)).

## Features

Inherited from upstream:

- List Events
- Create Events
- Edit Events
- Delete Events
- Auto create Notes from Events
- Insert Links to Events into Notes
- And more...

### Fork additions

- **Multiple Google accounts** — connect several accounts at once, with per-calendar
  selection across all of them. Existing single-account installs migrate automatically.
- **Month view** — toggle button to hide per-day event dots for a clean calendar.
- **Schedule view** — single-day agenda with duration-sized event cards, side-by-side and
  nested overlap handling, a status dot showing how imminent each event is, and a toggle to
  hide events that already ended.
- **Unified day navigation** — schedule, timeline and month views share one nav bar; the date
  header can be collapsed, and the current time shows in its place.
- **Time blocking** — right-click an event in the timeline or schedule view to apply a tag
  (name + color + optional description) to a generic time block, or convert any event into
  one. Tags are managed in the settings tab or via the `Manage gCal Time Block Tags` command.
- **Auto build time blocks** — fill each day's free space with placeholder blocks over a
  configurable window, block duration, and horizon, with a separate ignore-pattern list and
  "smart fill" that sizes blocks by time of day (ultradian rhythm). `Delete All gCal Time
  Blocks` undoes a bad fill.

See [CHANGELOG.md](CHANGELOG.md) for the full log of what diverged from upstream.

## Getting Started

Please see the [documentation](https://yukigasai.github.io/obsidian-google-calendar) on how to
get started. This documentation is also available in the [documentation](documentation/) folder
inside this repository, and the fork-only pages there (e.g.
[Time Blocking](documentation/content/TimeBlocking.md)) are kept up to date with the fork.

### Installing this fork

1. Download `main.js`, `manifest.json` and `styles.css` from the
   [latest release](https://github.com/is-cout/google-calendar-obsidian/releases/latest).
2. Drop them into `<vault>/.obsidian/plugins/google-calendar/`.
3. Reload Obsidian and enable the plugin.

If you already have the upstream plugin installed, this replaces it in the same folder — the
plugin id is unchanged, so your settings carry over.

## Thank you to the following plugins

[obsidian-google-calendar](https://github.com/YukiGasai/obsidian-google-calendar) — the
upstream plugin this fork is based on.

[obsidian-calendar-plugin](https://github.com/liamcain/obsidian-calendar-plugin)

[Obsidian Custom Frames](https://github.com/Ellpeck/ObsidianCustomFrames)

[Hotkeys for templates](https://github.com/Vinzent03/obsidian-hotkeys-for-templates)

[obsidian-periodic-notes](https://github.com/liamcain/obsidian-periodic-notes)
