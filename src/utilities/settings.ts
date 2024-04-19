export interface MarpSlidesSettings {
	CHROME_PATH: string;
	ThemePath: string;
	EnableHTML: boolean;
	MathTypesettings: string ;
	HTMLExportMode: string;
	EXPORT_PATH: string;
	EnableSyncPreview: boolean;
	EnableMarkdownItPlugins: boolean;
	AllowedMarkdownItContainers: string[];
}

export const DEFAULT_SETTINGS: MarpSlidesSettings = {
	CHROME_PATH: '',
	ThemePath: '',
	EnableHTML: false,
	MathTypesettings: 'mathjax',
	HTMLExportMode: 'bare',
	EXPORT_PATH: '',
	EnableSyncPreview: true,
	EnableMarkdownItPlugins: false,
	AllowedMarkdownItContainers: ['container', 'notes', 'warning']
}