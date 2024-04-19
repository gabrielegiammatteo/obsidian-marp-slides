import { MarkdownView, TAbstractFile, Plugin, addIcon, App, PluginSettingTab, Setting, EditorSuggest, EditorPosition, Editor, TFile, EditorSuggestTriggerInfo, EditorSuggestContext  } from 'obsidian';

import { MARP_PREVIEW_VIEW, MarpPreviewView } from './views/marpPreviewView';
import { MarpExport } from './utilities/marpExport';
import { ICON_SLIDE_PREVIEW, ICON_EXPORT_PDF, ICON_EXPORT_PPTX, ICON_SLIDE_PRESENT } from './utilities/icons';
import { Libs } from './utilities/libs';
import { MarpSlidesSettings, DEFAULT_SETTINGS } from 'utilities/settings';


export default class MarpSlides extends Plugin {
	
	public settings: MarpSlidesSettings;
	private slidesView : MarpPreviewView;
	private editorView : MarkdownView | null;

	async onload() {
		await this.loadSettings();

		const libsUtility = new Libs(this.settings);
		libsUtility.loadLibs(this.app);

		this.registerView(
			MARP_PREVIEW_VIEW,
			(leaf) => new MarpPreviewView(this.settings, leaf)
		);

		addIcon('slides-preview-marp', ICON_SLIDE_PREVIEW);
		addIcon('slides-marp-export-pdf', ICON_EXPORT_PDF);
		addIcon('slides-marp-export-pptx', ICON_EXPORT_PPTX);
		addIcon('slides-marp-slide-present', ICON_SLIDE_PRESENT);
		this.addRibbonIcon('slides-preview-marp', 'Show Slide Preview', async () => {
			await this.showPreviewSlide();
		});
		
		this.addCommand({
			id: 'preview',
			name: 'Slide Preview',
			callback: () => { this.showPreviewSlide();}
		});
		
		this.addCommand({
			id: 'export-pdf',
			name: 'Export PDF',
			callback: (() => this.exportFile('pdf'))
		});

		this.addCommand({
			id: 'export-pdf-notes',
			name: 'Export PDF with Notes',
			callback: (() => this.exportFile('pdf-with-notes'))
		});

		this.addCommand({
			id: 'export-html',
			name: 'Export HTML',
			callback: (() => this.exportFile('html'))
		});

		this.addCommand({
			id: 'export-pptx',
			name: 'Export PPTX',
			callback: (() => this.exportFile('pptx'))
		});

		this.addCommand({
			id: 'export-png',
			name: 'Export PNG',
			callback: (() => this.exportFile('png'))
		});		

		// this.addCommand({
		// 	id: 'export-deck',
		// 	name: 'Export Deck',
		// 	callback: (() => this.exportFile(''))
		// });

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new MarpSlidesSettingTab(this.app, this));

		if (this.settings.EnableSyncPreview)
			this.registerEditorSuggest(new LineSelectionListener(this.app, this));

		this.registerEvent(this.app.vault.on('modify', this.onChange.bind(this)));
	}

	onunload() {
		this.app.workspace.detachLeavesOfType(MARP_PREVIEW_VIEW);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	onChange(file: TAbstractFile) {
		if (file == this.editorView?.file) {
			this.slidesView.onChange(this.editorView);
		}
	}

	async exportFile(type: string){
		const file = this.app.workspace.getActiveFile();
		if(file !== null){	
		const marpCli = new MarpExport(this.settings);
			await marpCli.export(file,type);
		}
	}

	async showPreviewSlide(){
		this.editorView = this.app.workspace.getActiveViewOfType(MarkdownView);

		if (!this.editorView) {
			return;
		}

		this.slidesView = await this.activateView();
		this.slidesView.displaySlides(this.editorView);
	}
	
	async activateView() : Promise<MarpPreviewView> {
		this.app.workspace.detachLeavesOfType(MARP_PREVIEW_VIEW);
	
		await this.app.workspace.getLeaf('split').setViewState({
			type: MARP_PREVIEW_VIEW,
			active: true,
		});

		const leaf = this.app.workspace.getLeavesOfType(MARP_PREVIEW_VIEW)[0];

		this.app.workspace.revealLeaf(leaf);

		return leaf.view as MarpPreviewView;
	}

	getViewInstance(): MarpPreviewView | null {
		const leaf = this.app.workspace.getLeavesOfType(MARP_PREVIEW_VIEW)[0];
		if (leaf){
			this.app.workspace.revealLeaf(leaf);
			return leaf.view as MarpPreviewView;
		} else {
			return null;
		}
	}
}



export class MarpSlidesSettingTab extends PluginSettingTab {
	private plugin: MarpSlides;

	constructor(app: App, plugin: MarpSlides) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'MARP Slide Plugin - Settings'});

		new Setting(containerEl)
			.setName('Chrome Path')
			.setDesc('Sets the custom path for Chrome or Chromium-based browser to export PDF, PPTX, and image. If it\'s empty, Marp will find out the installed Google Chrome / Chromium / Microsoft Edge.')
			.addText(text => text
				.setPlaceholder('Enter CHROME_PATH')
				.setValue(this.plugin.settings.CHROME_PATH)
				.onChange(async (value) => {
					this.plugin.settings.CHROME_PATH = value;
					await this.plugin.saveSettings();
				}));
		
		new Setting(containerEl)
			.setName('Theme Path')
			.setDesc('Local paths to additional theme CSS for Marp core and Marpit framework. The rule for paths is following Markdown: Styles.')
			.addText(text => text
				.setPlaceholder('template\\marp\\themes')
				.setValue(this.plugin.settings.ThemePath)
				.onChange(async (value) => {
					this.plugin.settings.ThemePath = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Export Path')
			.setDesc('Sets the custom path to export PDF, PPTX, and images. If it\'s empty, Marp will export in the same folder of the note. Export path does not affect HTML export')
			.addText(text => text
				.setPlaceholder('C:\\Users\\user\\Downloads\\')
				.setValue(this.plugin.settings.EXPORT_PATH)
				.onChange(async (value) => {
					this.plugin.settings.EXPORT_PATH = value;
					await this.plugin.saveSettings();
				}));
		
		new Setting(containerEl)
			.setName('Enable HTML')
			.setDesc('Enable all HTML elements in Marp Markdown. Please Attention when you enable!!!')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.EnableHTML)
				.onChange(async (value) => {
					this.plugin.settings.EnableHTML = value;
					await this.plugin.saveSettings();
				}));
	
		new Setting(containerEl)
			.setName('Math Typesettings')
			.setDesc('Controls math syntax and the default library for rendering math in Marp Core. A using library can override by math global directive in Markdown.')
			.addDropdown(toggle => toggle
				.addOption("mathjax","mathjax")
				.addOption("katex","katex")
				.setValue(this.plugin.settings.MathTypesettings)
				.onChange(async (value) => {
					this.plugin.settings.MathTypesettings = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('HTML Export Mode')
			.setDesc('(Experimental) Controls HTML library for eporting HTML File in Marp Cli. bespoke.js is experimental')
			.addDropdown(toggle => toggle
				.addOption("bare","bare.js")
				.addOption("bespoke","bespoke.js")
				.setValue(this.plugin.settings.HTMLExportMode)
				.onChange(async (value) => {
					this.plugin.settings.HTMLExportMode = value;
					await this.plugin.saveSettings();
				}));
		
		new Setting(containerEl)
			.setName('Sync Preview')
			.setDesc('(Experimental) Sync the slide preview with the editor cursor')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.EnableSyncPreview)
				.onChange(async (value) => {
					this.plugin.settings.EnableSyncPreview = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('MarkdownIt Plugins')
			.setDesc('(Experimental) Enable the Markdown It Plugins (Mark, Containers, Kroki)')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.EnableMarkdownItPlugins)
				.onChange(async (value) => {
					this.plugin.settings.EnableMarkdownItPlugins = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('MarkdownIt Containers: Allowed names')
			.setDesc('(Experimental) Specify valid names for Markdown It Containers Plugin')
			.addTextArea(toggle => toggle
				.setValue(this.plugin.settings.AllowedMarkdownItContainers.join("\n"))
				.onChange(async (value) => {
					this.plugin.settings.AllowedMarkdownItContainers = value.split("\n");
					await this.plugin.saveSettings();
				}));
	}
}

class LineSelectionListener extends EditorSuggest<string> {
	private plugin: MarpSlides;

	constructor(app: App, plugin: MarpSlides) {
		super(app);
		this.plugin = plugin;
	}

	onTrigger(cursor: EditorPosition, editor: Editor, file: TFile): EditorSuggestTriggerInfo | null {
		//console.log("line: " + cursor.line);
		//console.log("ch: " + cursor.ch);
		//console.log("value: " + editor.getValue());
        
        let triggerInfo: EditorSuggestTriggerInfo = {start:cursor, end:cursor, query:""};
        const instance = this.plugin.getViewInstance();

		if (instance) {
			const lines = editor.getValue().split('\n');
			const firstNLines = lines.slice(0, cursor.line);
			const text = firstNLines.join('\n');
			
			const regex = new RegExp('---', 'g');
			let matches = text.match(regex);
			let slide = matches ? matches.length : 0;
			var matter = require('gray-matter');
			const frontMatter = matter(text);
			if (frontMatter.data !== null && Object.keys(frontMatter.data).length > 0) {
				instance.onLineChanged(slide - 2);
			} else {
				instance.onLineChanged(slide);
			}			
		}
		return null;
	}
	getSuggestions(context: EditorSuggestContext): string[] | Promise<string[]> {
		let suggestion :string[] = [];
		return suggestion;
		//throw new Error('Method not implemented.');
	}
	renderSuggestion(value: string, el: HTMLElement): void {
		throw new Error('Method not implemented.');
	}
	selectSuggestion(value: string, evt: MouseEvent | KeyboardEvent): void {
		throw new Error('Method not implemented.');
	}
}
