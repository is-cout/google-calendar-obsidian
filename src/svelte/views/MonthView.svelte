<script lang="ts">
    import type { ICalendarSource, IDayMetadata, IDot} from "obsidian-calendar-ui"
    import type { CodeBlockOptions, GoogleEvent } from '../../helper/types';
    
    import { Calendar as CalendarBase } from "obsidian-calendar-ui";
    import { EventListModal } from "../../modal/EventListModal";
    import { googleClearCachedEvents, listEvents } from "../../googleApi/GoogleListEvents";
    import { onDestroy } from "svelte";
    import _ from "lodash"
    import GoogleCalendarPlugin from "../../GoogleCalendarPlugin";
    import { getDailyNotes, getSingleDailyNote, getSingleWeeklyNote, openPeriodicNote, openPeriodicNoteInNewWindow } from "../../helper/DailyNoteHelper";
    import { createWeeklyNote } from "obsidian-daily-notes-interface";
	import { Menu, Platform } from "obsidian";
	import { DayCalendarView, VIEW_TYPE_GOOGLE_CALENDAR_DAY } from "../../view/DayCalendarView";
	import { ScheduleCalendarView, VIEW_TYPE_GOOGLE_CALENDAR_SCHEDULE } from "../../view/ScheduleCalendarView";
	import { VIEW_TYPE_GOOGLE_CALENDAR_WEEK, WeekCalendarView } from "../../view/WeekCalendarView";
	import ViewSettings from "../components/ViewSettings.svelte";
	import { onMount } from "svelte";

    export let codeBlockOptions: CodeBlockOptions;
    export let isObsidianView = false;
    export let showSettings = false;

    let displayedMonth;
    let dailyNoteList = getDailyNotes();
    let interval;
    let newDayInterval;
    let events: GoogleEvent[];
    let loading: boolean = true;
    let sources:ICalendarSource[];
    let today = window.moment();
    let plugin = GoogleCalendarPlugin.getInstance();

    // Event dots are shown unless explicitly disabled; toggle persists per month view.
    $: hideEventDots = codeBlockOptions.showEventDots === false;
    const toggleEventDots = () => {
        const currentlyShown = codeBlockOptions.showEventDots !== false;
        codeBlockOptions.showEventDots = !currentlyShown;
        codeBlockOptions = codeBlockOptions;
        plugin.settings.viewSettings["month"] = {
            ...plugin.settings.viewSettings["month"],
            showEventDots: codeBlockOptions.showEventDots,
        };
        plugin.saveSettings();
    };

    async function getSource(month:moment.Moment) {

        plugin.settings.dailyNoteDotColor = plugin.settings.dailyNoteDotColor;
        const prevMonthDate = month.clone().startOf("month").subtract(6, "days");
        const nextMonthDate = month.clone().endOf("month").add(12, "days");

        const eventsInMonth = await listEvents({
            startDate:prevMonthDate,
            endDate:nextMonthDate,
            include: codeBlockOptions.include,
            exclude: codeBlockOptions.exclude,
        });    

        //Don't do anything when events are the same
        if(_.isEqual(eventsInMonth, events) && _.isEqual(dailyNoteList, getDailyNotes())){
            return;
        }
        dailyNoteList = getDailyNotes();
        
        let eventsByDay = _.groupBy(eventsInMonth, event =>
            window.moment(event.start.date ?? event.start.dateTime).startOf('day').format()
        );

        events = eventsInMonth;
        const customTagsSource: ICalendarSource = {
            getWeeklyMetadata: async (week: moment.Moment): Promise<IDayMetadata> => {
                let dots:IDot[] = [];
                if(plugin.settings.activateDailyNoteAddon && plugin.settings.useWeeklyNotes){
                    const note = getSingleWeeklyNote(week);
                    if(note){
                        dots = [{isFilled: true, className: "googleCalendarDailyDot", color: "default"}]
                    }
                }
                return {
                    dataAttributes: {"amount": dots.length + ""},
                    dots: dots,
                };
            },
            getDailyMetadata: async (day: moment.Moment): Promise<IDayMetadata> => {

                let dots:IDot[] = [];
                if(plugin.settings.activateDailyNoteAddon){
                    const note = getSingleDailyNote(day);
                    if(note){
                        dots = [{isFilled: true, className: "googleCalendarDailyDot", color: "default"}]
                    }
                }
                const eventsOfTheDay = eventsByDay[day.startOf("day").format()]; 
                if (!eventsOfTheDay){
                    return {
                        dataAttributes: {"amount": dots.length + ""},
                        dots: dots,
                    };
                } 
                dots = [
                    ...dots,
                    ...eventsOfTheDay.map((event:GoogleEvent) => 
                        ({isFilled: true, className: `googleCalendarDot_${event.parent.colorId}`, color: "default"})
                    )
                ]

                return {
                    dataAttributes: {"amount": eventsOfTheDay.length + ""},
                    dots: dots,
                };
            }
        }
        loading = false;
        sources = null
        sources = [customTagsSource]
    }


    const getEventsOfDay = (eventList: GoogleEvent[], date: moment.Moment):GoogleEvent[] => {
        return eventList.filter(event => {
            if(event.start.date){
                return window.moment(event.start.date).isSame(date, 'day');
            }else{
                return window.moment(event.start.dateTime).isSame(date, 'day');
            }    
        })
    }


    const onClickDay = (date: moment.Moment, isMenu:boolean) => {
        new EventListModal(getEventsOfDay(events, date),"details", date, false, () => {
            googleClearCachedEvents();
            displayedMonth = displayedMonth
        }).open();
    }
    
    const onClickWeek = async (week: moment.Moment, isMenu:boolean) => {

        let weeklyNote = getSingleWeeklyNote(week)
        if(!weeklyNote){
            weeklyNote = await createWeeklyNote(week);
        }

        const leaf = app.workspace.getLeaf(false)
        await leaf.openFile(weeklyNote, { active: true });
    }

    const onContextMenuHotKey = (date: moment.Moment, event: MouseEvent, type: 'daily' | 'weekly'): boolean => {
        if(event.ctrlKey){
            openPeriodicNote({date, openInNewTab: true, type});
            return false;
        }
        if(event.shiftKey){
            openPeriodicNote({date, openInNewTab: false, type});
            return false;
        }
        if(event.altKey && Platform.isDesktop){  
            openPeriodicNoteInNewWindow({date, type});
            return false;
        }

        return true;
    }

    const onContextMenu = (date: moment.Moment, type: 'daily' | 'weekly'): Menu => {
        const note = type === "daily" ? getSingleDailyNote(date) : getSingleWeeklyNote(date);
        const typeText = type.charAt(0).toUpperCase() + type.slice(1)
        const menu = new Menu();

        if(!note){
            menu.addItem((item) => {
                item.setTitle(`Create ${typeText} Note`)
                item.setIcon("create-new")
                item.onClick(() => {
                    openPeriodicNote({date, openInNewTab: false, type});
                })
            })
            menu.addItem((item) => {
                item.setTitle(`Create ${typeText} Note Split Right`)
                item.setIcon("vertical-split")
                item.onClick(() => {
                    openPeriodicNote({date, openInNewTab: true, openToRight: "horizontal", type});
                })
            })
            menu.addItem((item) => {
                item.setTitle(`Create ${typeText} Note Split Down`)
                item.setIcon("horizontal-split")
                item.onClick(() => {
                    openPeriodicNote({date, openInNewTab: true, openToRight: "vertical", type});
                })
            })
        }else{
            menu.addItem((item) => {
                item.setTitle(`Open ${typeText} Note`)
                item.setIcon("file")
                item.onClick(() => {
                    openPeriodicNote({date, openInNewTab: false, type});
                })
            })
            menu.addItem((item) => {
                item.setTitle(`Open ${typeText} Note Split Right`)
                item.setIcon("vertical-split")
                item.onClick(() => {
                    openPeriodicNote({date, openInNewTab: true, openToRight: "horizontal", type});
                })
            })
            menu.addItem((item) => {
                item.setTitle(`Open ${typeText} Note Split Down`)
                item.setIcon("horizontal-split")
                item.onClick(() => {
                    openPeriodicNote({date, openInNewTab: true, openToRight: "vertical", type});
                })
            })
            //Make sure plugin wont crash on mobile
            if(Platform.isDesktop) {
                menu.addItem((item) => {
                    item.setTitle(`Open ${typeText} Note in new Window`)
                    item.setIcon("fullscreen")
                    item.onClick(() => {
                        openPeriodicNoteInNewWindow({date, type});
                    })
                })
            }
        }
        // Add extra function for daily notes
        if(type === "daily") {
            menu.addSeparator()

            menu.addItem((item) => {
                item.setTitle("Open Timeline View")
                item.setIcon("calendar")
                item.onClick(async () => {
                    const leaf = await plugin.initView(VIEW_TYPE_GOOGLE_CALENDAR_DAY);
                    if (leaf.view instanceof DayCalendarView) {
                        leaf.view.setDate(date);
                    }                  
                });
            })

            menu.addItem((item) => {
                item.setTitle("Open Schedule View")
                item.setIcon("bullet-list")
                item.onClick(async () => {
                    const leaf = await plugin.initView(VIEW_TYPE_GOOGLE_CALENDAR_SCHEDULE);
                    if (leaf.view instanceof ScheduleCalendarView) {
                        leaf.view.setDate(date);
                    }     
                });
            })
        }else {
            menu.addSeparator()

            menu.addItem((item) => {
                item.setTitle("Open Weekly View")
                item.setIcon("calendar")
                item.onClick(async () => {
                    const leaf = await plugin.initView(VIEW_TYPE_GOOGLE_CALENDAR_WEEK);
                    if (leaf.view instanceof WeekCalendarView) {
                        leaf.view.setDate(date);
                    }                  
                });
            })

            menu.addItem((item) => {
                item.setTitle("Open Schedule View")
                item.setIcon("bullet-list")
                item.onClick(async () => {
                    const leaf = await plugin.initView(VIEW_TYPE_GOOGLE_CALENDAR_SCHEDULE);
                    if (leaf.view instanceof ScheduleCalendarView) {
                        leaf.view.setDate(date);
                    }     
                });
            })
        }
        return menu;
    }

    const onContextMenuDay = (date: moment.Moment, event: MouseEvent): boolean => {
        if(onContextMenuHotKey(date, event, "daily")){
            onContextMenu(date, "daily").showAtPosition({ x: event.clientX, y: event.clientY });
        }
        return true;
    }

    const onContextMenuWeek = (date: moment.Moment, event: MouseEvent): boolean => {
        if(onContextMenuHotKey(date, event, "weekly")){
            onContextMenu(date, "weekly").showAtPosition({ x: event.clientX, y: event.clientY });
        }
        return true;
    }


    onMount(() => {
        displayedMonth = codeBlockOptions.date ? window.moment(codeBlockOptions.date).add(codeBlockOptions.offset, "month") : window.moment().add(codeBlockOptions.offset, "month");
    })


    $: {
        if(displayedMonth){
            if(interval){
                clearInterval(interval);
            }
            interval = setInterval(() => getSource(displayedMonth), 1000)

            if(newDayInterval){
                clearInterval(newDayInterval);
            }
            newDayInterval = setInterval(() => today = window.moment(), 60000)

            getSource(displayedMonth)
        }
    }
    onDestroy(() => {
        clearInterval(interval);
        clearInterval(newDayInterval);
    })

</script>
{#if isObsidianView}
    <ViewSettings bind:codeBlockOptions bind:showSettings/>
{/if}
{#if !codeBlockOptions.width || !codeBlockOptions.height}
    <div class="gcal-calendar-container">
        {#if loading}
            <p>Loading...</p>
        {:else}
            <button
                class="gcal-toggle-dots"
                aria-label={hideEventDots ? "Show event dots" : "Hide event dots"}
                on:click={toggleEventDots}
            >
                {#if hideEventDots}
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 8 10 8a9.74 9.74 0 0 0 5.39-1.61"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                {:else}
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8Z"/><circle cx="12" cy="12" r="3"/></svg>
                {/if}
            </button>
            <div style="--daily-dot-color: {plugin.settings.dailyNoteDotColor}" class:gcal-hide-event-dots={hideEventDots}>
                <CalendarBase
                    showWeekNums={plugin.settings.useWeeklyNotes}
                    {onClickDay}
                    {onClickWeek}
                    {onContextMenuDay}
                    {onContextMenuWeek}
                    bind:sources
                    bind:displayedMonth
                    bind:today
                />
            </div>
        {/if}
    </div>
{:else}
    <div 
        class="gcal-calendar-container" 
        style:width="{codeBlockOptions.width}px" 
        style:height="{codeBlockOptions.height}px"
        >
        {#if loading}
            <p>Loading...</p>
        {:else} 
            <div style="--theme-color: {plugin.settings.dailyNoteDotColor}" class:gcal-hide-event-dots={hideEventDots}>
                <CalendarBase
                    showWeekNums={false}
                    {onClickDay}
                    bind:sources
                    bind:displayedMonth
                    bind:today
                />
            </div>
        {/if}
    </div>
{/if}

<style>
    /* Anchor the icon toggle inside the calendar's nav row */
    .gcal-calendar-container {
        position: relative;
    }

    /* Icon-only toggle placed in the free space left of the month nav arrows,
       vertically centered on the nav row (which starts 0.6em from the top). */
    .gcal-toggle-dots {
        position: absolute;
        top: 0.6em;
        right: 130px;
        z-index: 2;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 1.5em;
        width: 28px;
        padding: 0;
        background: transparent;
        box-shadow: none;
        color: var(--text-muted);
        cursor: pointer;
    }

    .gcal-toggle-dots:hover {
        color: var(--text-normal);
    }

    /* Vertically center the "today" reset button with the month nav arrows */
    .gcal-calendar-container :global(.right-nav) {
        align-items: center;
    }

    /* Show the reset button label in English ("Today") instead of the localized word */
    .gcal-calendar-container :global(.reset-button) {
        font-size: 0 !important;
    }

    .gcal-calendar-container :global(.reset-button)::after {
        content: "Today";
        font-size: 0.7rem;
        letter-spacing: 1px;
    }
</style>

