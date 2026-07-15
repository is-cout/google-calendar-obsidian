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

    // The schedule view shows a single day only, so all-day and timed events are split
    // out and timed events are clustered by overlap for side-by-side rendering.
    $: allDayEvents = events.filter(event => event.start.date);
    $: timedEvents = events
        .filter(event => !event.start.date)
        .sort((a, b) => eventStart(a).valueOf() - eventStart(b).valueOf());
    $: clusters = buildClusters(timedEvents);

    const eventStart = (event: GoogleEvent): moment.Moment =>
        window.moment(event.start.dateTime ?? event.start.date);
    const eventEnd = (event: GoogleEvent): moment.Moment =>
        window.moment(event.end.dateTime ?? event.end.date);

    const durationMinutes = (event: GoogleEvent): number =>
        Math.max(1, eventEnd(event).diff(eventStart(event), "minutes"));

    // Block height signals duration: ~0.8px per minute, clamped so short events stay
    // tappable and long events don't dominate the view.
    const blockHeight = (event: GoogleEvent): number =>
        Math.min(240, Math.max(48, Math.round(durationMinutes(event) * 0.8)));

    const isPast = (event: GoogleEvent): boolean =>
        eventEnd(event).isBefore(window.moment(), "minute");

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

    const getEvents = async(date:moment.Moment) => {
        if(loading) return;
        if(!date?.isValid()){
            loading = false;
            return;
        }

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
            return;
        }
        events = newEvents;
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
        interval = setInterval(() => getEvents(date), 5000);
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
            <DayNavigation bind:dateOffset bind:date bind:startDate />
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
                            class="gcal-schedule-allday-chip {isPast(event) ? "gcal-schedule-pastEvent" : ""}"
                            style:border-left-color="{getColorFromEvent(event)}"
                            on:click="{(e) => goToEvent(event, e)}"
                            on:keypress="{(e) => goToEvent(event, e)}"
                        >{event.summary}</div>
                    {/each}
                </div>
            {/if}

            <div class="gcal-schedule-timeline">
                {#each clusters as cluster}
                    <div class="gcal-schedule-cluster">
                        {#each cluster as event}
                            <div
                                class="gcal-schedule-block {event.recurringEventId ? "gcal-schedule-recurring" : ""} {isPast(event) ? "gcal-schedule-pastEvent" : ""}"
                                style:height="{blockHeight(event)}px"
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
    }

    /* Each event is a square-ish card whose height signals its duration */
    .gcal-schedule-block {
        flex: 1 1 0;
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

    .gcal-schedule-recurring .gcal-schedule-block-time::after {
        content: " ↺";
        color: var(--text-faint);
    }

    .gcal-schedule-pastEvent {
        opacity: 0.5;
    }

    </style>
