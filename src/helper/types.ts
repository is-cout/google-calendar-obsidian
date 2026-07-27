/**
 * This file contains all custom types defined to work with typescript
 * Most types come from the Calendar API 
 */

import type { SplitDirection, TFile } from "obsidian";


// One connected Google account. Multiple accounts can be connected at once; each keeps
// its own refresh token and its own OAuth client config (custom or the default proxy).
export interface GoogleAccount {
    id: string;            // the account's primary calendar id (its email address)
    label: string;         // human-readable name shown in settings (the email)
    refreshToken: string;
    useCustomClient: boolean;
    clientId: string;
    clientSecret: string;
    oAuthServer: string;   // only used when useCustomClient is false
}

export interface GoogleCalendarPluginSettings {
    // Authentication settings (used as the config for the NEXT account being added)
	useCustomClient: boolean;
    googleOAuthServer: string;
    googleClientId: string;
    googleClientSecret: string;
    googleRefreshToken: string;

    // Connected accounts
    accounts: GoogleAccount[];

    // Notification settings
    useNotification: boolean;
	showNotice: boolean;
	
    // Event note settings
    eventNoteNameFormat: string;
    optionalNotePrefix: string;
    defaultTemplate: string;
	defaultFolder: string;
    autoCreateEventNotes: boolean;
		autoCreateEventNotesMarker: string;
        autoCreateEventKeepOpen: boolean;
        importStartOffset: number;
        importEndOffset: number;

    // Calendar settings
    defaultCalendar: string;
    calendarBlackList: [string, string][];
	ignorePatternList: string[];
    insertTemplates: Template[];
    useDefaultTemplate: boolean;
    
    // Daily note settings
    activateDailyNoteAddon: boolean;
    dailyNoteDotColor: string;
    useWeeklyNotes: boolean;
    
    // Hidden settings
    timelineHourFormat: number;
    usDateFormat: boolean;

    // Time blocking settings
    timeBlockEventName: string;
    timeBlockColorId: string;
    timeBlockTags: TimeBlockTag[];
    // Auto build: which part of the day may be filled, how long the blocks are,
    // how far ahead to fill and which events don't count as busy.
    timeBlockFillStartHour: number;
    timeBlockFillEndHour: number;
    timeBlockDuration: number;      // minutes, used when smart fill is off
    timeBlockFillDays: number;      // days ahead to fill, starting today
    timeBlockSmartFill: boolean;
    timeBlockIgnorePatterns: string[];

    // General settings
    refreshInterval: number;
    atAnnotationEnabled: boolean;
    debugMode: boolean;

	viewSettings: { [type in string]: CodeBlockOptions };
    }

// A reusable label applied to a generic time blocking event. Applying it renames the
// event to the tag's name and repaints it with the tag's Google event color.
export interface TimeBlockTag {
	id: string;
	name: string;
	colorId: string;      // Google event colorId ("1" - "11")
	description?: string; // optional, written to the event description when applied
}

export interface Template {
	name: string,
	insertType: string,
	calendarList: string[], //Ids of calendars
	tableOptions: string[], //Object paths from event
}

export interface GoogleCalendar {
	// The account this calendar belongs to (set when the calendar list is fetched).
	account?: GoogleAccount;
	kind: "calendar#calendarListEntry";
	etag: string;
	id: string;
	summary: string;
	description: string;
	location: string;
	timeZone: string;
	summaryOverride: string;
	colorId: string;
	backgroundColor: string;
	foregroundColor: string;
	hidden: boolean;
	selected: boolean;
	accessRole: string;
	defaultReminders: [
		{
			method: string;
			minutes: number;
		}
	];
	notificationSettings: {
		notifications: [
			{
				type: string;
				method: string;
			}
		];
	};
	primary: boolean;
	deleted: boolean;
	conferenceProperties: {
		allowedConferenceSolutionTypes: [string];
	};
}

export interface GoogleCalendarList {
	kind: "calendar#calendarList";
	etag: string;
	nextPageToken: string;
	nextSyncToken: string;
	items: [GoogleCalendar];
}

export interface GoogleEvent {
	parent?: GoogleCalendar;
	kind?: "calendar#event";
	etag?: string;
	id?: string;
	status?: string;
	htmlLink?: string;
	created?: string;
	updated?: string;
	summary?: string;
	description?: string;
	location?: string;
	colorId?: string;
	creator?: {
		id?: string;
		email?: string;
		displayName?: string;
		self?: boolean;
	};
	organizer?: {
		id?: string;
		email?: string;
		displayName?: string;
		self?: boolean;
	};
	start: {
		date?: string;
		dateTime?: string;
		timeZone?: string;
	};
	end: {
		date?: string;
		dateTime?: string;
		timeZone?: string;
	};
	endTimeUnspecified?: boolean;
	recurrence?: string[];
	recurringEventId?: string;
	originalStartTime?: {
		date?: string;
		dateTime?: string;
		timeZone?: string;
	};
	transparency?: string;
	visibility?: string;
	iCalUID?: string;
	sequence?: number;
	attendees?: [
		{
			id?: string;
			email?: string;
			displayName?: string;
			organizer?: boolean;
			self?: boolean;
			resource?: boolean;
			optional?: boolean;
			responseStatus?: string;
			comment?: string;
			additionalGuests?: number;
		}
	];
	attendeesOmitted?: boolean;
	extendedProperties?: {
		private?: {
			string?: string;
		};
		shared?: {
			string?: string;
		};
	};
	hangoutLink?: string;
	conferenceData?: {
		createRequest?: {
			requestId?: string;
			conferenceSolutionKey?: {
				type?: string;
			};
			status?: {
				statusCode?: string;
			};
		};
		entryPoints?: [
			{
				entryPointType?: string;
				uri?: string;
				label?: string;
				pin?: string;
				accessCode?: string;
				meetingCode?: string;
				passcode?: string;
				password?: string;
			}
		];
		conferenceSolution?: {
			key?: {
				type?: string;
			};
			name?: string;
			iconUri?: string;
		};
		conferenceId?: string;
		signature?: string;
		notes?: string;
	};
	gadget?: {
		type?: string;
		title?: string;
		link?: string;
		iconLink?: string;
		width?: number;
		height?: number;
		display?: string;
		preferences?: {
			string?: string;
		};
	};
	anyoneCanAddSelf?: boolean;
	guestsCanInviteOthers?: boolean;
	guestsCanModify?: boolean;
	guestsCanSeeOtherGuests?: boolean;
	privateCopy?: boolean;
	locked?: boolean;
	reminders?: {
		useDefault?: boolean;
		overrides?: [
			{
				method?: string;
				minutes?: number;
			}
		];
	};
	source?: {
		url?: string;
		title?: string;
	};
	attachments?: [
		{
			fileUrl?: string;
			title?: string;
			mimeType?: string;
			iconLink?: string;
			fileId?: string;
		}
	];
	eventType?: string;
}

export interface GoogleEventList {
	kind: "calendar#events";
	etag: string;
	summary: string;
	description: string;
	updated: string;
	timeZone: string;
	accessRole: string;
	defaultReminders: [
		{
			method: string;
			minutes: number;
		}
	];
	nextPageToken: string;
	nextSyncToken: string;
	items: GoogleEvent[];
}

export interface GoogleInstaces {
	kind: "calendar#events";
	etag: string;
	summary: string;
	description: string;
	updated: string;
	timeZone: string;
	accessRole: string;
	defaultReminders: [
		{
			method: string;
			minutes: number;
		}
	];
	nextPageToken: string;
	nextSyncToken: string;
	items: GoogleEvent[];
}

export interface TimeLineOptions {
	type: string;
	date: string;
	width: number;
	height: number;
}

export interface EventCacheKey {
	start: string;
	end: string;
	calendar: string;
}
export interface EventCacheValue {
	events: GoogleEvent[];
	updated: moment.Moment;
}

export interface ListOptions {
	startDate?: moment.Moment;
	endDate?: moment.Moment;
	exclude?: string[];
	include?: string[];
	// Defaults to true. Set to false to get the events the plugin-wide `ignorePatternList`
	// hides — that list is about what the views show, not about what occupies the calendar.
	applyIgnorePatterns?: boolean;
}

export interface IGoogleCalendarPluginApi {
	getEvent: (id: string, calendarId: string) => Promise<GoogleEvent>,
	getEvents: (input: ListOptions) => Promise<GoogleEvent[]>,
	getCalendars: () => Promise<GoogleCalendar[]>,
    createEvent: (input:GoogleEvent) => Promise<GoogleEvent>,
    deleteEvent: (event:GoogleEvent, deleteAll:boolean) => Promise<boolean>,
    updateEvent: (event:GoogleEvent, updateSingle: boolean) => Promise<GoogleEvent>,
	createEventNote: (event:GoogleEvent, eventDirectory: string, templatePath: string) => Promise<TFile>,
}
export interface CodeBlockOptions {
	type?: "web" | "month" | "day" | "schedule" | "week" | "year";
	date?: string;
	width?: number;
	height?: number;
	navigation?: boolean;
	timespan?: number;
	include?: string[];
	exclude?: string[];
	view?: "day" | "week" | "month" | "agenda";
	theme?: string;
	hourRange?: number[];
	showAllDay?: boolean;
	offset?: number;
	size?: number;
	// Month view only: hide the per-day event dots for a clean calendar. Defaults to shown.
	showEventDots?: boolean;
	// Day/schedule/timeline: collapse the big date header to just the nav arrows.
	compactHeader?: boolean;
	// Schedule view only: hide events that already ended, so the current one is first.
	hidePastEvents?: boolean;
	// Keep this for backwards compatibility with old code blocks replacing with offset
	dayOffset?: number;
}



export type EventNoteQueryResult = {
	event: GoogleEvent;
	file: TFile | null;
}


export type CustomTask = {
    event: GoogleEvent;
    steps: number;
    goal: number;
    current: number;
    done: boolean;
}

export interface OpenPeriodicNoteOptions {
	date?: moment.Moment;
	openToRight?: SplitDirection;
	openInNewTab?: boolean;
	type?: "daily" | "weekly" | "monthly" | "yearly";
}

export interface ApiRequestData {
	url: string;
	method: string;
	body?: any;
}

export enum MoveType {
	DRAG,
	RESIZE_TOP,
	RESIZE_BOTTOM,
}

export interface MouseControlData {
	moveType: MoveType;
	time?: number;
	e?: MouseEvent;
	startState: {
		top: number;
		left: number;
		height: number;
		width: number;
	},
	endState: {
		top: number;
		left: number;
		height: number;
		width: number;
		horizontal: number;
	}
}

export interface Location {
	event: GoogleEvent;
	x: number;
	y: number;
	width: number;
	height: number;
	fullDay: boolean;
}