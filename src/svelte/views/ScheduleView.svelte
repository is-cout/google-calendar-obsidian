<script lang="ts">
    import type { CodeBlockOptions, GoogleEvent } from "../../helper/types";

    import { googleClearCachedEvents, listEvents } from "../../googleApi/GoogleListEvents";
    import { getColorFromEvent } from "../../googleApi/GoogleColors";
    import { EventDetailsModal } from "../../modal/EventDetailsModal";
    import { onDestroy } from "svelte";
	import GoogleCalendarPlugin from "../../GoogleCalendarPlugin";
	import ViewSettings from "../components/ViewSettings.svelte";
    import DayNavigation from "../components/DayNavigation.svelte";
	import { VIEW_TYPE_GOOGLE_CALENDAR_EVENT_DETAILS } from "../../view/EventDetailsView";

    export let codeBlockOptions: CodeBlockOptions;
    export let isObsidianView = false;
    export let showSettings = false;

    let plugin = GoogleCalendarPlugin.getInstance();
    let startDate:moment.Moment = codeBlockOptions.date ? window.moment(codeBlockOptions.date) : window.moment();
    let dateOffset = 0;
    let date;
    let loading = false;
    let events:GoogleEvent[] = [];
    let interval;
    let hourFormat = plugin.settings.timelineHourFormat;

    // Refreshed on every poll so the past/current split stays current over time.
    let now = window.moment();

    // Hiding past events keeps the current event at the top of the list.
    let hidePast = codeBlockOptions.hidePastEvents === true;
    const toggleHidePast = () => {
        hidePast = !hidePast;
        codeBlockOptions.hidePastEvents = hidePast;
        const type = codeBlockOptions?.type;
        if (type) {
            plugin.settings.viewSettings[type] = {
                ...plugin.settings.viewSettings[type],
                hidePastEvents: hidePast,
            };
        }
        plugin.saveSettings();
    };

    // The schedule view shows a single day only, so all-day and timed events are split
    // out and timed events are clustered by overlap for side-by-side rendering.
    $: allDayEvents = events.filter(event => event.start.date);
    $: timedEvents = events
        .filter(event => !event.start.date)
        .filter(event => !hidePast || !isPast(event, now))
        .sort((a, b) => eventStart(a).valueOf() - eventStart(b).valueOf());
    $: clusters = buildClusters(timedEvents);

    const eventStart = (event: GoogleEvent): moment.Moment =>
        window.moment(event.start.dateTime ?? event.start.date);
    const eventEnd = (event: GoogleEvent): moment.Moment =>
        window.moment(event.end.dateTime ?? event.end.date);

    const durationMinutes = (event: GoogleEvent): number =>
        Math.max(1, eventEnd(event).diff(eventStart(event), "minutes"));

    const isPast = (event: GoogleEvent, ref: moment.Moment): boolean =>
        eventEnd(event).isBefore(ref, "minute");

    // Layout scale: block height signals duration. Minimums keep text readable.
    const SCALE = 1.0;         // px per minute
    const MIN_BLOCK = 64;      // top-level block / container
    const MAX_SINGLE = 300;    // cap for a standalone block
    const MIN_CHILD = 34;      // readable height a nested child should reach
    const MAX_SCALE = 3;       // cap on stretching a container to fit its children
    const MAX_CONTAINER = 560; // cap on total container height

    // Day the currently-shown events belong to, so an auto-refresh that briefly returns
    // an empty list (e.g. during a token refresh) doesn't blank the view.
    let loadedDayKey = "";

    // Greedy column assignment for events that overlap each other in time.
    const assignColumns = (list: GoogleEvent[]): { placed: { event: GoogleEvent, col: number }[], ncols: number } => {
        const colEnds: moment.Moment[] = [];
        const placed = list.map((event) => {
            const start = eventStart(event);
            let col = colEnds.findIndex((end) => !start.isBefore(end));
            if (col === -1) {
                col = colEnds.length;
                colEnds.push(eventEnd(event));
            } else {
                colEnds[col] = eventEnd(event);
            }
            return { event, col };
        });
        return { placed, ncols: colEnds.length };
    }

    // If one event in the cluster time-contains all the others, nest them inside its box.
    // Otherwise fall back to equal-height side-by-side columns.
    const buildClusterLayout = (cluster: GoogleEvent[]) => {
        if (cluster.length === 1) {
            const event = cluster[0];
            return {
                type: "single",
                event,
                height: Math.min(MAX_SINGLE, Math.max(MIN_BLOCK, durationMinutes(event) * SCALE)),
            };
        }

        let container = cluster[0];
        for (const event of cluster) {
            if (durationMinutes(event) > durationMinutes(container)) container = event;
        }
        const cStart = eventStart(container);
        const cEnd = eventEnd(container);
        const children = cluster.filter((e) => e !== container);
        const allInside = children.every((e) => !eventStart(e).isBefore(cStart) && !eventEnd(e).isAfter(cEnd));

        if (allInside) {
            const cSpan = durationMinutes(container);
            // Stretch the container so even the shortest child reaches a readable height.
            // Scaling the container (instead of clamping each child) keeps every child's
            // height truly proportional to its duration and fills the space better.
            const needed = Math.max(...children.map((c) => MIN_CHILD / durationMinutes(c)));
            const scale = Math.min(Math.max(SCALE, needed), MAX_SCALE);
            const height = Math.min(MAX_CONTAINER, Math.max(MIN_BLOCK, cSpan * scale));

            const sorted = [...children].sort((a, b) => eventStart(a).valueOf() - eventStart(b).valueOf());
            const { placed, ncols } = assignColumns(sorted);
            const kids = placed.map(({ event, col }) => {
                const kidHeight = Math.max(20, (durationMinutes(event) / cSpan) * height);
                return {
                    event,
                    top: (eventStart(event).diff(cStart, "minutes") / cSpan) * height,
                    height: kidHeight,
                    // Too short for two stacked lines: fall back to a single ellipsized line
                    oneLine: kidHeight < 46,
                    leftPct: (col / ncols) * 100,
                    widthPct: 100 / ncols,
                };
            });
            return { type: "container", container, height, kids };
        }

        const height = Math.min(MAX_SINGLE, Math.max(MIN_BLOCK, Math.max(...cluster.map(durationMinutes)) * SCALE));
        return { type: "columns", events: cluster, height };
    }

    $: laidOutClusters = clusters.map(buildClusterLayout);

    // Group timed events into clusters where each event overlaps the running span,
    // so overlapping events can be laid out next to each other.
    const buildClusters = (list: GoogleEvent[]): GoogleEvent[][] => {
        const result: GoogleEvent[][] = [];
        let current: GoogleEvent[] = [];
        let currentEnd: moment.Moment = null;
        for (const event of list) {
            if (current.length && eventStart(event).isBefore(currentEnd)) {
                current.push(event);
                if (eventEnd(event).isAfter(currentEnd)) currentEnd = eventEnd(event);
            } else {
                if (current.length) result.push(current);
                current = [event];
                currentEnd = eventEnd(event);
            }
        }
        if (current.length) result.push(current);
        return result;
    }

    const getEvents = async(date:moment.Moment, isRefresh = false) => {
        if(loading) return;
        if(!date?.isValid()){
            loading = false;
            return;
        }

        const dayKey = date.format("YYYY-MM-DD");
        const sameDay = dayKey === loadedDayKey;
        now = window.moment();

        hourFormat = plugin.settings.timelineHourFormat;
        let newEvents = await listEvents({
            startDate:date,
            endDate:date,
            include: codeBlockOptions.include,
            exclude: codeBlockOptions.exclude
        });

        newEvents = newEvents.filter(event => {
            if(event.start.date) return codeBlockOptions.showAllDay;
            const startMoment = window.moment(event.start.dateTime)
            const endMoment = window.moment(event.end.dateTime);
            const startHour = startMoment.minutes() > 0 ? startMoment.hour() + 1 : startMoment.hour();
            const endHour   = endMoment.minutes()   > 0 ? endMoment.hour()   + 1 : endMoment.hour();
            return (startHour >= codeBlockOptions.hourRange[0] && startHour <= codeBlockOptions.hourRange[1]) ||
                   (endHour >= codeBlockOptions.hourRange[0] && endHour <= codeBlockOptions.hourRange[1]) ||
                    (startHour < codeBlockOptions.hourRange[0] && endHour > codeBlockOptions.hourRange[1])
        })
        //only reload if events change
        if(JSON.stringify(newEvents) == JSON.stringify(events)){
            loading = false;
            loadedDayKey = dayKey;
            return;
        }
        // On the same day, ignore a transient empty result (likely a failed/again-refreshing
        // request) so the events don't flash away and come back.
        if(sameDay && isRefresh && newEvents.length === 0 && events.length > 0){
            loading = false;
            return;
        }
        events = newEvents;
        loadedDayKey = dayKey;
    }

    const getDateText = ( date:moment.Moment, hourFormat: number):string => {
        switch (hourFormat) {
            case 0:
                return date.format("H:mm");
            case 1:
                return date.format("HH:mm");
            case 2:
                return date.format("h:mm");
            case 3:
                return date.format("hh:mm");
            case 4:
                return date.format("h:mm A")
            case 5:
                return date.format("hh:mm A")
        }
    }

    const getDateString = (event: GoogleEvent, hourFormat: number):string => {
        if(event.start.date){
            return "All day";
        }else{
            const start = getDateText(window.moment(event.start.dateTime), hourFormat)
            const end = getDateText(window.moment(event.end.dateTime), hourFormat)
            return `${start}-${end}`
        }
    }

    const goToEvent = (event:GoogleEvent, e:any) => {
        if(e.shiftKey){
            plugin.initView(VIEW_TYPE_GOOGLE_CALENDAR_EVENT_DETAILS, event, () => {
				googleClearCachedEvents();
				getEvents(date);
			})
        }else{
            new EventDetailsModal(event, () => {
                googleClearCachedEvents();
                getEvents(date);
            }).open();
        }
    }

    $: {
        startDate = codeBlockOptions.date
        ? window.moment(codeBlockOptions.date).add(codeBlockOptions.offset, "days")
        : window.moment().add(codeBlockOptions.offset, "days");
        date = codeBlockOptions.navigation ? startDate.clone().local().add(dateOffset, "days") : startDate;

        if(interval){
            clearInterval(interval);
        }
        interval = setInterval(() => getEvents(date, true), 5000);
        getEvents(date);
    }

    onDestroy(() => {
        clearInterval(interval);
    })

    const switchHourDisplay = () => {
        hourFormat += 1;
        if(hourFormat > 5){
            hourFormat = 0;
        }
        plugin.settings.timelineHourFormat = hourFormat;
        plugin.saveSettings();
    }
    </script>
    {#if isObsidianView}
        <ViewSettings bind:codeBlockOptions bind:showSettings/>
    {/if}

    <div class ="gcal-schedule-container">
        {#if codeBlockOptions.navigation && date}
            <DayNavigation bind:dateOffset bind:date bind:startDate {codeBlockOptions}>
                <button
                    slot="extra"
                    class="gcal-icon-btn {hidePast ? "is-active" : ""}"
                    aria-label={hidePast ? "Show past events" : "Hide past events"}
                    on:click={toggleHidePast}
                >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>
                </button>
            </DayNavigation>
        {:else if date}
            <div class="gcal-schedule-static-header">
                <h3 class="gcal-schedule-static-weekday">{date.format("dddd")}</h3>
                <h1 class="gcal-schedule-static-date">{date.format("MMMM DD, YYYY")}</h1>
            </div>
        {/if}
        {#if !events?.length}
        <span>No events</span>
        {:else}
            {#if allDayEvents.length}
                <div class="gcal-schedule-allday-row">
                    {#each allDayEvents as event}
                        <div
                            class="gcal-schedule-allday-chip {isPast(event, now) ? "gcal-schedule-pastEvent" : ""}"
                            style:border-left-color="{getColorFromEvent(event)}"
                            on:click="{(e) => goToEvent(event, e)}"
                            on:keypress="{(e) => goToEvent(event, e)}"
                        >{event.summary}</div>
                    {/each}
                </div>
            {/if}

            <div class="gcal-schedule-timeline">
                {#each laidOutClusters as cl}
                    {#if cl.type === "single"}
                        <div
                            class="gcal-schedule-block {cl.event.recurringEventId ? "gcal-schedule-recurring" : ""} {isPast(cl.event, now) ? "gcal-schedule-pastEvent" : ""}"
                            style:height="{cl.height}px"
                            style:border-left-color="{getColorFromEvent(cl.event)}"
                            on:click="{(e) => goToEvent(cl.event, e)}"
                            on:keypress="{(e) => goToEvent(cl.event, e)}"
                        >
                            <span
                                class="gcal-schedule-block-time"
                                on:click|stopPropagation={switchHourDisplay}
                                on:keypress|stopPropagation={switchHourDisplay}
                            >{getDateString(cl.event, hourFormat)}</span>
                            <span class="gcal-schedule-block-title">{cl.event.summary}</span>
                        </div>
                    {:else if cl.type === "container"}
                        <div
                            class="gcal-schedule-block gcal-schedule-container-block {cl.container.recurringEventId ? "gcal-schedule-recurring" : ""} {isPast(cl.container, now) ? "gcal-schedule-pastEvent" : ""}"
                            style:height="{cl.height}px"
                            style:border-left-color="{getColorFromEvent(cl.container)}"
                            on:click="{(e) => goToEvent(cl.container, e)}"
                            on:keypress="{(e) => goToEvent(cl.container, e)}"
                        >
                            <div class="gcal-schedule-container-label">
                                <span
                                    class="gcal-schedule-block-time"
                                    on:click|stopPropagation={switchHourDisplay}
                                    on:keypress|stopPropagation={switchHourDisplay}
                                >{getDateString(cl.container, hourFormat)}</span>
                                <span class="gcal-schedule-block-title">{cl.container.summary}</span>
                            </div>
                            <div class="gcal-schedule-nested">
                                {#each cl.kids as kid}
                                    <div
                                        class="gcal-schedule-block gcal-schedule-child-block {kid.event.recurringEventId ? "gcal-schedule-recurring" : ""} {isPast(kid.event, now) ? "gcal-schedule-pastEvent" : ""}"
                                        style:top="{kid.top}px"
                                        style:height="{kid.height}px"
                                        style:left="{kid.leftPct}%"
                                        style:width="calc({kid.widthPct}% - 4px)"
                                        style:border-left-color="{getColorFromEvent(kid.event)}"
                                        on:click|stopPropagation="{(e) => goToEvent(kid.event, e)}"
                                        on:keypress|stopPropagation="{(e) => goToEvent(kid.event, e)}"
                                    >
                                        {#if kid.oneLine}
                                            <span class="gcal-schedule-block-oneline">{getDateString(kid.event, hourFormat)} · {kid.event.summary}</span>
                                        {:else}
                                            <span class="gcal-schedule-block-time">{getDateString(kid.event, hourFormat)}</span>
                                            <span class="gcal-schedule-block-title">{kid.event.summary}</span>
                                        {/if}
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {:else}
                        <div class="gcal-schedule-cluster">
                            {#each cl.events as event}
                                <div
                                    class="gcal-schedule-block {event.recurringEventId ? "gcal-schedule-recurring" : ""} {isPast(event, now) ? "gcal-schedule-pastEvent" : ""}"
                                    style:height="{cl.height}px"
                                    style:border-left-color="{getColorFromEvent(event)}"
                                    on:click="{(e) => goToEvent(event, e)}"
                                    on:keypress="{(e) => goToEvent(event, e)}"
                                >
                                    <span
                                        class="gcal-schedule-block-time"
                                        on:click|stopPropagation={switchHourDisplay}
                                        on:keypress|stopPropagation={switchHourDisplay}
                                    >{getDateString(event, hourFormat)}</span>
                                    <span class="gcal-schedule-block-title">{event.summary}</span>
                                </div>
                            {/each}
                        </div>
                    {/if}
                {/each}
            </div>
        {/if}
    </div>


    <style>

    .gcal-schedule-static-header {
        margin-bottom: 12px;
    }

    .gcal-schedule-static-weekday {
        margin: 0;
        text-transform: capitalize;
        color: var(--text-muted);
        font-weight: 500;
    }

    .gcal-schedule-static-date {
        margin: 0;
    }

    /* Prettier day header for the navigation variant, scoped to this view */
    .gcal-schedule-container :global(.gcal-date-dayofweek) {
        text-transform: capitalize;
        color: var(--text-muted);
        font-weight: 500;
    }

    .gcal-schedule-allday-row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 12px;
    }

    .gcal-schedule-allday-chip {
        border-left: 4px solid gray;
        border-radius: 6px;
        padding: 4px 8px;
        background-color: var(--background-secondary);
        cursor: pointer;
        font-size: 0.85rem;
    }

    .gcal-schedule-timeline {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    /* A cluster holds overlapping events, shown side by side */
    .gcal-schedule-cluster {
        display: flex;
        flex-direction: row;
        gap: 8px;
        align-items: stretch;
        flex-shrink: 0;
    }

    /* Only inside a side-by-side cluster do blocks share the width evenly */
    .gcal-schedule-cluster > .gcal-schedule-block {
        flex: 1 1 0;
    }

    /* Each event is a square-ish card whose height signals its duration.
       Must not flex-shrink: these are children of a column flex container, so a
       flex basis here would override the inline height and squash every card. */
    .gcal-schedule-block {
        flex-shrink: 0;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
        border-left: 4px solid gray;
        border-radius: 8px;
        padding: 8px 10px;
        background-color: var(--background-secondary);
        cursor: pointer;
        overflow: hidden;
    }

    .gcal-schedule-block:hover {
        background-color: var(--background-modifier-hover);
    }

    .gcal-schedule-block-time {
        font-size: 0.8rem;
        color: var(--text-muted);
        white-space: nowrap;
        cursor: pointer;
    }

    .gcal-schedule-block-title {
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    /* A container block holds nested children on its right, its own label on the left */
    .gcal-schedule-container-block {
        flex-direction: row;
        align-items: stretch;
        gap: 8px;
    }

    .gcal-schedule-container-label {
        display: flex;
        flex-direction: column;
        gap: 4px;
        flex: 0 0 32%;
        min-width: 80px;
        overflow: hidden;
    }

    .gcal-schedule-nested {
        position: relative;
        flex: 1 1 auto;
        min-width: 0;
    }

    /* Nested children are absolutely positioned by their start time within the container */
    .gcal-schedule-child-block {
        position: absolute;
        box-sizing: border-box;
        gap: 2px;
        padding: 4px 8px;
        font-size: 0.85em;
    }

    /* Very short children can't fit two lines, so time and title share one */
    .gcal-schedule-block-oneline {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        line-height: 1.2;
    }

    .gcal-schedule-recurring .gcal-schedule-block-time::after {
        content: " ↺";
        color: var(--text-faint);
    }

    .gcal-schedule-pastEvent {
        opacity: 0.5;
    }

    </style>
