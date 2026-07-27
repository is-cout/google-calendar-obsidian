---
title: Time Blocking
---

Time blocking lets you reserve slots in your day with generic placeholder events and decide
later what each slot is actually for.

## Workflow

1. Create the placeholder events in Google Calendar, all with the same title (default
   `Time blocking`) and whatever durations you need.
2. Define your tags, either in the plugin settings or with the
   `Manage gCal Time Block Tags` command. A tag has a **name**, a **color** and an optional
   **description**.
3. In the [[TimelineView]] or the [[ScheduleView]], **right-click** a placeholder event.
   The tag picker opens; picking a tag renames the event to the tag name, repaints it with
   the tag color and, if the tag has one, writes the tag description to the event.

## Right-clicking a normal event

If the event you right-click is *not* a placeholder, the popup asks whether it should be
turned into one. Confirming renames it to the configured time block name and applies the
configured time block color, then the tag picker opens right away — this is also how you
re-tag an event you already tagged.

## Auto build

Creating the placeholders by hand gets old fast, so the `Auto Build gCal Time Blocks`
command does it for you: for each day in the horizon it looks at the free space inside the
fill window and slices it into placeholder events.

`Delete All gCal Time Blocks` is the undo — it removes every *untagged* placeholder from now
until the end of the horizon, after asking for confirmation. Tagged blocks were renamed, so
they are never deleted.

### What counts as busy

A slot is considered taken by any timed event, *except*:

- all-day events — they describe the day, they don't occupy a slot in it;
- events shown as **Free** in Google Calendar (`transparency: transparent`);
- invites you **declined**;
- events matching a fill ignore pattern.

Note that an event spanning several days is split into one 00:00-23:59 piece per day, so it
makes every day it covers fully busy. If that is not what you want (a vacation, a sprint),
add it to the fill ignore patterns.

Turn on **Debug mode** to see the decision per event in the developer console: each day logs
its window, one `BUSY` / `SKIP …` line per timed event, and the resulting free stretches.

### Smart fill

With smart fill on, the block length comes from the time of day instead of a fixed number:

|Start hour|Block length|Why|
|---|---|---|
|before 09|45 min|still ramping up|
|09 – 12|90 min|late-morning focus peak — a full ultradian cycle|
|12 – 14|30 min|post-lunch dip, only shallow work is realistic|
|14 – 17|60 min|second wind, below the morning peak|
|17 – 20|45 min|winding down|
|after 20|30 min|night|

This follows the ultradian rhythm (the "basic rest-activity cycle"): attention runs in
roughly 90-minute waves, and the early afternoon has a well documented dip.

A gap always gets whole blocks — a leftover shorter than 15 minutes is absorbed by the block
before it instead of becoming a stub.

## Settings

|Setting|Description|
|---|---|
|Time block event name|Title the placeholder events use. Right-clicking an event with this title (case-insensitive) opens the tag picker.|
|Time block event color|Google event color applied when converting an event into a time block.|
|Tags|The list of tags: name, color and optional description.|
|Fill window|Start and end of the part of the day auto build may fill, in half hour steps (e.g. 05:30 - 21:00). Time that already passed is never filled.|
|Smart fill|Derive each block's length from the time of day (see above) instead of the fixed duration.|
|Block duration|Length of each block when smart fill is off. Default 30 minutes.|
|Days to fill|How many days ahead to fill, starting today.|
|Fill ignore patterns|Regex patterns; events whose title matches don't count as busy, so auto build may place blocks over them. Separate from the plugin-wide [[IgnorePatternList]].|

The two ignore lists are deliberately unrelated: [[IgnorePatternList]] decides what the
views *show*, while an event it hides still occupies its slot in the calendar and still
blocks auto build. Only the fill ignore patterns free a slot up.

Events on a calendar in the [[CalendarBlackList]] are invisible to the plugin entirely, so
auto build does not see them as busy either.

Blocks are created in the [[DefaultCalendar]].

Tags are stored in the plugin settings, not in Google Calendar — the calendar only ever sees
the resulting title, color and description.
