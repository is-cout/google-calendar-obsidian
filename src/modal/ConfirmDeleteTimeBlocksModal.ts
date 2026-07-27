import type { GoogleEvent } from "../helper/types";

import { Modal, Setting } from "obsidian";
import GoogleCalendarPlugin from "../GoogleCalendarPlugin";
import { deleteTimeBlocks } from "../helper/TimeBlockBuilder";
import { createNotice } from "../helper/NoticeHelper";

/**
 * Deleting a whole auto-built day is destructive and easy to trigger by accident,
 * so the count is shown and confirmed first.
 */
export class ConfirmDeleteTimeBlocksModal extends Modal {

	events: GoogleEvent[];

	constructor(events: GoogleEvent[]) {
		super(GoogleCalendarPlugin.getInstance().app);
		this.events = events;
	}

	onOpen(): void {
		const { contentEl } = this;
		const settings = GoogleCalendarPlugin.getInstance().settings;

		contentEl.createEl("h3", { text: "Delete time blocks" });
		contentEl.createEl("p", {
			text: `Delete ${this.events.length} untagged "${settings.timeBlockEventName}" event(s) in the next ${settings.timeBlockFillDays} day(s)? Tagged blocks are not touched.`,
		});

		new Setting(contentEl)
			.addButton((button) => {
				button.setButtonText("Delete");
				button.setWarning();
				button.onClick(async () => {
					this.close();
					const deleted = await deleteTimeBlocks(this.events);
					createNotice(`Deleted ${deleted} time block(s).`);
				});
			})
			.addButton((button) => {
				button.setButtonText("Cancel");
				button.onClick(() => this.close());
			});
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
