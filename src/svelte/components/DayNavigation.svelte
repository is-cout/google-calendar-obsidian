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

    // Collapsed header shows only the nav arrows; the three-dots button toggles it and the
    // choice is persisted (codeBlockOptions is the same object as the persisted view settings).
    let compact = codeBlockOptions?.compactHeader === true;
    const toggleCompact = () => {
        compact = !compact;
        codeBlockOptions.compactHeader = compact;
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

<div class="gcal-title-container">
    <div class="gcal-date-container">
        {#if !compact}
            <h3 class="gcal-date-dayofweek">{date.format("dddd")}</h3>
            <h1 class="gcal-date-main">{date.format("MMMM DD, YYYY")}</h1>
        {/if}
        <div class="gcal-nav-container">
            <button class="gcal-nav-button gcal-kebab-button" aria-label={compact ? "Show date header" : "Hide date header"} on:click={toggleCompact}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
            </button>
            {#if !compact}
                <button class="gcal-nav-button" aria-label="Back 1 week" on:click={minusOneWeek}>&lt;&lt;</button>
            {/if}
            <button class="gcal-nav-button" aria-label="Back 1 day"     on:click={minusOneDay}>&lt;</button>
            <button class="gcal-nav-button" aria-label="Jump to today"  on:click={backToday}>{window.moment().isSame(startDate, "day") ? "Today" : "Start"}</button>
            <button class="gcal-nav-button" aria-label="Forward 1 day"  on:click={plusOneDay}>&gt;</button>
            {#if !compact}
                <button class="gcal-nav-button" aria-label="Forward 1 week" on:click={plusOneWeek}>&gt;&gt;</button>
                <button class="gcal-new-event-button" aria-label="Create Event" on:click={openNewEventDialog}>+</button>
            {/if}
        </div>
    </div>
</div>


<style>
    .gcal-date-container{
        margin-bottom: 10px;
    }

    .gcal-date-dayofweek, .gcal-date-main {
        margin: 0px;
    }

    .gcal-nav-container {
        margin-bottom: 1em;
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .gcal-kebab-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }
</style>