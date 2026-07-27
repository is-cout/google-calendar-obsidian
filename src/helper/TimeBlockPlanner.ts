/**
 * Pure planning math for time block auto build: where is the day free, and how should a
 * free stretch be cut into blocks. Kept free of plugin/Obsidian imports so it can be
 * reasoned about (and tested) on its own.
 */

import type { GoogleEvent } from "./types";

// A leftover gap shorter than this is not worth its own event; it is merged into the
// block before it instead.
export const MIN_BLOCK_MINUTES = 15;

export interface FreeGap {
	start: moment.Moment;
	end: moment.Moment;
}

// A busy slot keeps its title so the debug log can name what blocked the fill.
export interface BusySlot extends FreeGap {
	summary?: string;
}

export interface FillWindowOptions {
	startHour: number;
	endHour: number;
	ignorePatterns: string[];
}

/**
 * Target block length for a block starting at a given hour, used by smart fill.
 *
 * Based on the ultradian rhythm ("basic rest-activity cycle"): attention runs in roughly
 * 90 minute waves, the late morning is the strongest sustained-focus window, the early
 * afternoon has a well documented post-lunch dip, and energy tapers off in the evening.
 * So blocks are long where deep work is realistic and short where it is not.
 */
export function smartDurationForHour(hour: number): number {
	if (hour < 9) return 45;   // ramping up
	if (hour < 12) return 90;  // late morning: peak focus, full ultradian cycle
	if (hour < 14) return 30;  // post-lunch dip: short, shallow tasks
	if (hour < 17) return 60;  // second wind, but below the morning peak
	if (hour < 20) return 45;  // winding down
	return 30;                 // night
}

/**
 * Events whose title matches one of the fill ignore patterns don't count as busy, so their
 * slots can still be filled. This list is separate from the plugin-wide `ignorePatternList`,
 * which only decides what the views show.
 */
export function isIgnoredForFilling(event: GoogleEvent, patterns: string[]): boolean {
	const summary = event.summary ?? "";
	return (patterns ?? []).some((pattern) => {
		if (!pattern) return false;
		try {
			return new RegExp(pattern, "i").test(summary);
		} catch (error) {
			// An invalid regex should not quietly match nothing: fall back to substring.
			return summary.toLowerCase().includes(pattern.toLowerCase());
		}
	});
}

/**
 * Whether an event actually occupies its time, using the same signals Google's own
 * free/busy view uses: an event shown as "Free" (transparent) or one the user declined
 * does not make them busy. Without this a work calendar full of declined invites and
 * "Free" background events leaves no space to fill at all.
 */
export function occupiesTime(event: GoogleEvent): boolean {
	if (event.transparency === "transparent") return false;
	const self = event.attendees?.find((attendee) => attendee.self);
	if (self?.responseStatus === "declined") return false;
	return true;
}

/**
 * The busy time inside the day's fill window, as sorted, window-clipped slots.
 * Exported so callers can log exactly what blocked them.
 */
export function getBusySlots(events: GoogleEvent[], windowStart: moment.Moment, windowEnd: moment.Moment, ignorePatterns: string[]): BusySlot[] {
	return events
		.filter((event) => !event.start.date)              // all-day events don't block the day
		.filter((event) => occupiesTime(event))
		.filter((event) => !isIgnoredForFilling(event, ignorePatterns))
		.map((event) => ({
			start: window.moment(event.start.dateTime),
			end: window.moment(event.end.dateTime),
			summary: event.summary,
		}))
		.filter((slot) => slot.end.isAfter(windowStart) && slot.start.isBefore(windowEnd))
		.sort((a, b) => a.start.valueOf() - b.start.valueOf());
}

/**
 * The fill window of `day`, clipped so time that has already passed is never filled.
 * Returns null when nothing of the window is left.
 */
export function getFillWindow(day: moment.Moment, now: moment.Moment, options: FillWindowOptions): FreeGap | null {
	// Hours are fractional (5.5 == 05:30), so the window is applied in minutes.
	let start = day.clone().startOf("day").add(Math.round(options.startHour * 60), "minutes");
	const end = day.clone().startOf("day").add(Math.round(options.endHour * 60), "minutes");

	if (start.isBefore(now)) {
		start = now.clone();
	}
	if (!start.isBefore(end)) return null;

	return { start, end };
}

/**
 * The parts of the day's fill window that are not already taken by an event.
 */
export function findFreeGaps(busy: BusySlot[], fillWindow: FreeGap): FreeGap[] {
	const gaps: FreeGap[] = [];
	let cursor = fillWindow.start.clone();

	for (const slot of busy) {
		if (slot.start.isAfter(cursor)) {
			const gapEnd = slot.start.isBefore(fillWindow.end) ? slot.start.clone() : fillWindow.end.clone();
			gaps.push({ start: cursor.clone(), end: gapEnd });
		}
		if (slot.end.isAfter(cursor)) {
			cursor = slot.end.clone();
		}
		if (!cursor.isBefore(fillWindow.end)) break;
	}
	if (cursor.isBefore(fillWindow.end)) {
		gaps.push({ start: cursor.clone(), end: fillWindow.end.clone() });
	}

	return gaps.filter((gap) => gap.end.diff(gap.start, "minutes") >= MIN_BLOCK_MINUTES);
}

/**
 * Slice a free gap into block-sized pieces. A trailing piece shorter than
 * MIN_BLOCK_MINUTES is absorbed by the previous block instead of becoming a stub.
 */
export function splitGapIntoBlocks(gap: FreeGap, smart: boolean, fixedDuration: number): FreeGap[] {
	const blocks: FreeGap[] = [];
	let cursor = gap.start.clone();

	while (gap.end.diff(cursor, "minutes") >= MIN_BLOCK_MINUTES) {
		const remaining = gap.end.diff(cursor, "minutes");
		const target = smart ? smartDurationForHour(cursor.hour()) : fixedDuration;
		let length = Math.min(target, remaining);

		// Absorb a leftover that is too small to stand on its own.
		if (remaining - length < MIN_BLOCK_MINUTES) {
			length = remaining;
		}

		blocks.push({ start: cursor.clone(), end: cursor.clone().add(length, "minutes") });
		cursor = cursor.clone().add(length, "minutes");
	}

	return blocks;
}
