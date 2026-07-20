<script lang="ts">
    import { EventDetailsModal } from "../../modal/EventDetailsModal"
    import { googleClearCachedEvents } from "../../googleApi/GoogleListEvents";
	import { VIEW_TYPE_GOOGLE_CALENDAR_EVENT_DETAILS } from "../../view/EventDetailsView";
    import GoogleCalendarPlugin from "../../GoogleCalendarPlugin";

    import type { CodeBlockOptions } from "../../helper/types";

    export let date;
    export let startDate;
    export let dateOffset;
    export let codeBlockOptions: CodeBlockOptions = {};
    let plugin = GoogleCalendarPlugin.getInstance();

    // Collapsed header shows only the nav; the toggle choice is persisted per view type.
    // ViewSettings replaces viewSettings[type] with a fresh object, so codeBlockOptions can
    // become detached from the stored settings — write into viewSettings[type] directly.
    let compact = codeBlockOptions?.compactHeader === true;
    const toggleCompact = () => {
        compact = !compact;
        codeBlockOptions.compactHeader = compact;
        const type = codeBlockOptions?.type;
        if (type) {
            plugin.settings.viewSettings[type] = {
                ...plugin.settings.viewSettings[type],
                compactHeader: compact,
            };
        }
        plugin.saveSettings();
    };

    const minusOneWeek = () => dateOffset-= 7;
    const minusOneDay  = () => dateOffset-= 1;
    const backToday    = () => dateOffset = 0;
    const plusOneWeek  = () => dateOffset+= 7;
    const plusOneDay   = () => dateOffset+= 1;

    const openNewEventDialog = (e: MouseEvent) => {  
        if(e.shiftKey) {
            plugin.initView(VIEW_TYPE_GOOGLE_CALENDAR_EVENT_DETAILS, {start:{}, end:{}}, () => {
					googleClearCachedEvents();
                    date=date;
            })
        }else {
            new EventDetailsModal({start:{}, end:{}}, () =>{
                googleClearCachedEvents()
                date=date;
            }).open()
        }
    }

</script>

<div class="gcal-day-nav">
    {#if !compact}
        <div class="gcal-date-container">
            <h3 class="gcal-date-dayofweek">{date.format("dddd")}</h3>
            <h1 class="gcal-date-main">{date.format("MMMM DD, YYYY")}</h1>
        </div>
    {/if}
    <div class="gcal-right-nav">
        <button class="gcal-icon-btn" aria-label={compact ? "Show date header" : "Hide date header"} on:click={toggleCompact}>
            {#if compact}
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 8 10 8a9.74 9.74 0 0 0 5.39-1.61"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
            {:else}
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8Z"/><circle cx="12" cy="12" r="3"/></svg>
            {/if}
        </button>
        {#if !compact}
            <button class="gcal-icon-btn" aria-label="Back 1 week" on:click={minusOneWeek}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 6 11 12 17 18"/><polyline points="11 6 5 12 11 18"/></svg>
            </button>
        {/if}
        <button class="gcal-icon-btn" aria-label="Back 1 day" on:click={minusOneDay}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 6 9 12 15 18"/></svg>
        </button>
        <button class="gcal-today-btn" aria-label="Jump to today" on:click={backToday}>{window.moment().isSame(startDate, "day") ? "Today" : "Start"}</button>
        <button class="gcal-icon-btn" aria-label="Forward 1 day" on:click={plusOneDay}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>
        </button>
        {#if !compact}
            <button class="gcal-icon-btn" aria-label="Forward 1 week" on:click={plusOneWeek}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="7 6 13 12 7 18"/><polyline points="13 6 19 12 13 18"/></svg>
            </button>
            <button class="gcal-icon-btn" aria-label="Create Event" on:click={openNewEventDialog}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
        {/if}
    </div>
</div>


<style>
    .gcal-day-nav {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 1em;
        min-height: 2.2em;
    }

    .gcal-date-container {
        display: flex;
        flex-direction: column;
    }

    .gcal-date-dayofweek {
        margin: 0;
        text-transform: capitalize;
        color: var(--text-muted);
        font-weight: 500;
    }

    .gcal-date-main {
        margin: 0;
    }

    .gcal-right-nav {
        display: flex;
        align-items: center;
        gap: 2px;
        margin-left: auto;
    }

    /* Clean, background-less controls matching the month view's nav */
    .gcal-icon-btn,
    .gcal-today-btn {
        background: transparent;
        border: none;
        box-shadow: none;
        color: var(--text-muted);
        cursor: pointer;
    }

    .gcal-icon-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 24px;
        width: 24px;
        padding: 0;
    }

    .gcal-icon-btn:hover,
    .gcal-today-btn:hover {
        color: var(--text-normal);
        background: transparent;
        box-shadow: none;
    }

    .gcal-today-btn {
        display: inline-flex;
        align-items: center;
        height: 24px;
        line-height: 1;
        font-size: 0.7rem;
        font-weight: 600;
        letter-spacing: 1px;
        text-transform: uppercase;
        padding: 0 4px;
    }
</style>