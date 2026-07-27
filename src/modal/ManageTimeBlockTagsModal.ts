import type { TimeBlockTag } from "../helper/types";

import { Modal, Setting } from "obsidian";
import GoogleCalendarPlugin from "../GoogleCalendarPlugin";
import { getEventColorOptions, loadEventColorOptions } from "../googleApi/GoogleColors";

/**
 * CRUD for the time block tags. Reachable from the settings tab and from the
 * "Manage gCal time block tags" command.
 */
export class ManageTimeBlockTagsModal extends Modal {

	constructor() {
		super(GoogleCalendarPlugin.getInstance().app);
	}

	async onOpen(): Promise<void> {
		this.render();
		// Refresh the color list from the API, in case Google added colors.
		await loadEventColorOptions();
		this.render();
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private render(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl("h3", { text: "Time block tags" });
		renderTimeBlockTagList(contentEl, () => this.render());
	}
}

/**
 * Renders the editable tag list into a container. Shared by the modal and the settings tab
 * so both stay in sync when a tag is added, edited or removed.
 * @param containerEl where to render
 * @param refresh called after a change that alters the list itself (add/remove)
 */
export function renderTimeBlockTagList(containerEl: HTMLElement, refresh: () => void): void {
	const plugin = GoogleCalendarPlugin.getInstance();
	const tags = plugin.settings.timeBlockTags ?? [];

	if (!tags.length) {
		containerEl.createEl("p", { text: "No tags yet. Add one below." });
	}

	tags.forEach((tag: TimeBlockTag) => {
		new Setting(containerEl)
			.setClass("SubSettings")
			.addText((text) =>
				text
					.setPlaceholder("Tag name")
					.setValue(tag.name)
					.onChange(async (value) => {
						tag.name = value;
						await plugin.saveSettings();
					})
			)
			.addDropdown((dropdown) => {
				getEventColorOptions().forEach((color) => dropdown.addOption(color.id, color.name));
				dropdown.setValue(tag.colorId);
				dropdown.onChange(async (value) => {
					tag.colorId = value;
					await plugin.saveSettings();
				});
			})
			.addText((text) =>
				text
					.setPlaceholder("Description (optional)")
					.setValue(tag.description ?? "")
					.onChange(async (value) => {
						tag.description = value;
						await plugin.saveSettings();
					})
			)
			.addButton((button) => {
				button.setButtonText("Remove");
				button.onClick(async () => {
					plugin.settings.timeBlockTags = plugin.settings.timeBlockTags.filter((t) => t.id !== tag.id);
					await plugin.saveSettings();
					refresh();
				});
			});
	});

	new Setting(containerEl)
		.addButton((button) => {
			button.setButtonText("Add tag");
			button.setCta();
			button.onClick(async () => {
				plugin.settings.timeBlockTags = [
					...(plugin.settings.timeBlockTags ?? []),
					{
						id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
						name: "New tag",
						colorId: getEventColorOptions()[0].id,
					},
				];
				await plugin.saveSettings();
				refresh();
			});
		});
}
