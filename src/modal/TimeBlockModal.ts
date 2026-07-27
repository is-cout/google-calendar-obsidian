import type { GoogleEvent } from "../helper/types";

import { Modal, Setting } from "obsidian";
import GoogleCalendarPlugin from "../GoogleCalendarPlugin";
import { getHexFromEventColorId } from "../googleApi/GoogleColors";
import { applyTimeBlockTag, convertToTimeBlock, isTimeBlockEvent } from "../helper/TimeBlockHelper";
import { ManageTimeBlockTagsModal } from "./ManageTimeBlockTagsModal";

/**
 * Opened by right-clicking an event in the timeline or schedule view.
 * A generic time block event gets the tag picker, any other event gets asked
 * whether it should become a time block first.
 */
export class TimeBlockModal extends Modal {

	event: GoogleEvent;
	closeFunction: () => void;

	constructor(event: GoogleEvent, closeFunction?: () => void) {
		super(GoogleCalendarPlugin.getInstance().app);
		this.event = event;
		this.closeFunction = closeFunction;
	}

	onOpen(): void {
		this.render();
	}

	onClose(): void {
		this.contentEl.empty();
		if (this.closeFunction) {
			this.closeFunction();
		}
	}

	private render(): void {
		const { contentEl } = this;
		contentEl.empty();

		if (isTimeBlockEvent(this.event)) {
			this.renderTagPicker(contentEl);
		} else {
			this.renderConvertPrompt(contentEl);
		}
	}

	private renderTagPicker(contentEl: HTMLElement): void {
		const plugin = GoogleCalendarPlugin.getInstance();
		contentEl.createEl("h3", { text: "Apply a time block tag" });

		const tags = plugin.settings.timeBlockTags ?? [];
		if (!tags.length) {
			contentEl.createEl("p", { text: "No tags defined yet." });
			new Setting(contentEl).addButton((button) => {
				button.setButtonText("Manage tags");
				button.onClick(() => {
					this.close();
					new ManageTimeBlockTagsModal().open();
				});
			});
			return;
		}

		const list = contentEl.createDiv({ cls: "gcal-timeblock-tag-list" });
		tags.forEach((tag) => {
			const item = list.createDiv({ cls: "gcal-timeblock-tag" });
			item.createDiv({ cls: "gcal-timeblock-tag-color" }).style.backgroundColor = getHexFromEventColorId(tag.colorId);
			const texts = item.createDiv({ cls: "gcal-timeblock-tag-text" });
			texts.createSpan({ cls: "gcal-timeblock-tag-name", text: tag.name });
			if (tag.description) {
				texts.createSpan({ cls: "gcal-timeblock-tag-desc", text: tag.description });
			}
			item.onClickEvent(async () => {
				await applyTimeBlockTag(this.event, tag);
				this.close();
			});
		});
	}

	private renderConvertPrompt(contentEl: HTMLElement): void {
		const blockName = GoogleCalendarPlugin.getInstance().settings.timeBlockEventName;
		contentEl.createEl("h3", { text: "Not a time block event" });
		contentEl.createEl("p", {
			text: `Turn "${this.event.summary}" into a "${blockName}" event so a tag can be applied to it?`,
		});

		new Setting(contentEl)
			.addButton((button) => {
				button.setButtonText("Convert to time block");
				button.setCta();
				button.onClick(async () => {
					const updated = await convertToTimeBlock(this.event);
					if (!updated) {
						this.close();
						return;
					}
					// Keep the modal open on the tag picker: converting is only ever a
					// step towards tagging the slot.
					this.event = updated;
					this.render();
				});
			})
			.addButton((button) => {
				button.setButtonText("Cancel");
				button.onClick(() => this.close());
			});
	}
}
