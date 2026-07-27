/**
 * Auto build / clear of time block events.
 *
 * Creating the placeholder events by hand is the tedious part of time blocking, so this
 * scans the free space in the fill window and fills it with individual placeholder events
 * that can later be tagged. The planning math lives in TimeBlockPlanner.
 */

import type { GoogleEvent } from "./types";
import GoogleCalendarPlugin from "../GoogleCalendarPlugin";
import { googleListEvents, googleClearCachedEvents } from "../googleApi/GoogleListEvents";
import { googleCreateEvent } from "../googleApi/GoogleCreateEvent";
import { googleDeleteEvent } from "../googleApi/GoogleDeleteEvent";
import { createNotice } from "./NoticeHelper";
import { isTimeBlockEvent } from "./TimeBlockHelper";
import { findFreeGaps, getBusySlots, getFillWindow, isIgnoredForFilling, occupiesTime, splitGapIntoBlocks } from "./TimeBlockPlanner";
import { log, logError } from "./log";

const hhmm = (moment: moment.Moment): string => moment.format("HH:mm");

/**
 * Fill every free gap in the configured window, for the configured number of days,
 * with placeholder time block events.
 * @returns how many events were created
 */
export async function autoBuildTimeBlocks(): Promise<number> {
	const settings = GoogleCalendarPlugin.getInstance().settings;
	const now = window.moment();

	log("[timeblock] auto build start", {
		window: `${settings.timeBlockFillStartHour}-${settings.timeBlockFillEndHour}`,
		days: settings.timeBlockFillDays,
		smart: settings.timeBlockSmartFill,
		duration: settings.timeBlockDuration,
		ignorePatterns: settings.timeBlockIgnorePatterns,
	});

	let created = 0;
	for (let dayOffset = 0; dayOffset < settings.timeBlockFillDays; dayOffset++) {
		const day = now.clone().add(dayOffset, "days");
		const dayLabel = day.format("YYYY-MM-DD");

		const fillWindow = getFillWindow(day, now, {
			startHour: settings.timeBlockFillStartHour,
			endHour: settings.timeBlockFillEndHour,
			ignorePatterns: settings.timeBlockIgnorePatterns,
		});
		if (!fillWindow) {
			log(`[timeblock] ${dayLabel} window already over, skipping`);
			continue;
		}

		let events: GoogleEvent[];
		try {
			// applyIgnorePatterns: false — an event hidden from the views by the plugin-wide
			// ignore list still occupies that time in the calendar. Only the time block
			// fill ignore patterns may free a slot up.
			events = await googleListEvents({
				startDate: day.clone(),
				endDate: day.clone(),
				applyIgnorePatterns: false,
			});
		} catch (error) {
			logError(error);
			createNotice(`Could not read ${dayLabel}, stopping.`);
			break;
		}

		const busy = getBusySlots(events, fillWindow.start, fillWindow.end, settings.timeBlockIgnorePatterns);
		const gaps = findFreeGaps(busy, fillWindow);

		// Logged as flat strings on purpose: the console collapses arrays, and the whole
		// point of this log is seeing every slot without expanding anything.
		log(`[timeblock] ${dayLabel} window ${hhmm(fillWindow.start)}-${hhmm(fillWindow.end)}, ${events.length} events`);
		events
			.filter((event) => !event.start.date)
			.forEach((event) => {
				const reason = !occupiesTime(event)
					? (event.transparency === "transparent" ? "SKIP shown as free" : "SKIP declined")
					: isIgnoredForFilling(event, settings.timeBlockIgnorePatterns)
						? "SKIP fill ignore pattern"
						: "BUSY";
				log(`[timeblock] ${dayLabel}   ${reason}: ${hhmm(window.moment(event.start.dateTime))}-${hhmm(window.moment(event.end.dateTime))} ${event.summary ?? ""}`);
			});
		log(`[timeblock] ${dayLabel} busy: ${busy.map((slot) => `${hhmm(slot.start)}-${hhmm(slot.end)}`).join(" | ") || "none"}`);
		log(`[timeblock] ${dayLabel} free: ${gaps.map((gap) => `${hhmm(gap.start)}-${hhmm(gap.end)}`).join(" | ") || "none"}`);

		for (const gap of gaps) {
			for (const block of splitGapIntoBlocks(gap, settings.timeBlockSmartFill, settings.timeBlockDuration)) {
				try {
					await googleCreateEvent({
						summary: settings.timeBlockEventName,
						colorId: settings.timeBlockColorId,
						start: { dateTime: block.start.format() },
						end: { dateTime: block.end.format() },
					});
					created++;
				} catch (error) {
					createNotice(`Could not create a time block at ${dayLabel} ${hhmm(block.start)}.`);
					logError(error);
				}
			}
		}
	}

	googleClearCachedEvents();
	return created;
}

/**
 * All untagged time block events inside the fill horizon, from now on.
 * Tagged blocks were renamed, so they are not matched and never deleted.
 */
export async function findTimeBlocksToDelete(): Promise<GoogleEvent[]> {
	const settings = GoogleCalendarPlugin.getInstance().settings;
	const now = window.moment();

	// Same reason as in autoBuildTimeBlocks: a time block hidden by the plugin-wide ignore
	// list is still a time block and must be deletable.
	const events = await googleListEvents({
		startDate: now.clone(),
		endDate: now.clone().add(Math.max(0, settings.timeBlockFillDays - 1), "days"),
		applyIgnorePatterns: false,
	});

	return events
		.filter(isTimeBlockEvent)
		.filter((event) => window.moment(event.end.dateTime ?? event.end.date).isAfter(now));
}

/**
 * Delete the given time block events.
 * @returns how many were deleted
 */
export async function deleteTimeBlocks(events: GoogleEvent[]): Promise<number> {
	let deleted = 0;
	for (const event of events) {
		try {
			await googleDeleteEvent(event, false);
			deleted++;
		} catch (error) {
			logError(error);
		}
	}
	googleClearCachedEvents();
	return deleted;
}
