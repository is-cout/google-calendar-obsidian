/**
 * Time blocking helpers.
 *
 * The workflow: the user pre-creates generic placeholder events (all named the same,
 * e.g. "Time blocking") to reserve slots in the day. Later they right-click one and
 * apply a tag, which renames it and repaints it with the tag color. An event that is
 * not a placeholder can be converted back into one, which makes it taggable again.
 */

import type { GoogleEvent, TimeBlockTag } from "./types";
import GoogleCalendarPlugin from "../GoogleCalendarPlugin";
import { updateEvent } from "../googleApi/GoogleUpdateEvent";
import { googleClearCachedEvents } from "../googleApi/GoogleListEvents";

/**
 * An event counts as a generic time block while its title still matches the configured
 * placeholder name (case-insensitive). Once tagged it is renamed, so it stops matching.
 */
export function isTimeBlockEvent(event: GoogleEvent): boolean {
	const blockName = GoogleCalendarPlugin.getInstance().settings.timeBlockEventName?.trim();
	if (!blockName) return false;
	return (event.summary ?? "").trim().toLowerCase() === blockName.toLowerCase();
}

/**
 * Rename and recolor a time block event according to the tag.
 */
export async function applyTimeBlockTag(event: GoogleEvent, tag: TimeBlockTag): Promise<GoogleEvent> {
	const updated: GoogleEvent = {
		...event,
		summary: tag.name,
		colorId: tag.colorId,
	};
	if (tag.description) {
		updated.description = tag.description;
	}
	const result = await updateEvent(updated, false);
	googleClearCachedEvents();
	return result;
}

/**
 * Turn any event back into a generic time block, so a tag can be applied to it.
 */
export async function convertToTimeBlock(event: GoogleEvent): Promise<GoogleEvent> {
	const settings = GoogleCalendarPlugin.getInstance().settings;
	const result = await updateEvent({
		...event,
		summary: settings.timeBlockEventName,
		colorId: settings.timeBlockColorId,
	}, false);
	googleClearCachedEvents();
	return result;
}
