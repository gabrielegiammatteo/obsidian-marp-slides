import { Vault, normalizePath, FileSystemAdapter, TFile } from 'obsidian';
import { MarpSlidesSettings } from './settings';

export class FilePath {

    private settings : MarpSlidesSettings;

    constructor(settings: MarpSlidesSettings) {
        this.settings = settings;
    }

    private getRootPath(file: TFile): string {
		let basePath = (file.vault.adapter as FileSystemAdapter).getBasePath();
        if (basePath.startsWith('/')){
            basePath = `/${normalizePath(basePath)}`;
        }
        else
        {
            basePath = normalizePath(basePath);
        }
		//console.log(`Root Path: ${basePath}`);
		return basePath;
	}

	getCompleteFileBasePath(file: TFile): string{

        //const basePath = `app://local/${this.getRootPath(file)}/${normalizePath(file.parent.path)}/`;
        const resourcePath = (file.vault.adapter as FileSystemAdapter).getResourcePath(normalizePath(file.parent.path)).split("?");

        return `${resourcePath[0]}/`;
	}

    getCompleteFilePath(file: TFile) : string{
        const basePath = `${this.getRootPath(file)}/${normalizePath(file.path)}`;
        //console.log(`Complete File Path: ${basePath}`);
        return basePath;
	}

    getThemePath(file: TFile): string{
        const themePath = `${this.getRootPath(file)}/${normalizePath(this.settings.ThemePath)}`;
        if (this.settings.ThemePath != ''){
            return themePath;
        } 
        else
        {
            return '';
        }
    }

    private getPluginDirectory(vault: Vault): string {
        let fileSystem = vault.adapter as FileSystemAdapter;
        let path = normalizePath(`${fileSystem.getBasePath()}/${vault.configDir}/plugins/marp-slides`) + '/';
        console.log(path);
        return path;
	}

    getLibDirectory(vault: Vault): string {
        let pluginDirectory = this.getPluginDirectory(vault);
        let path = normalizePath(`${pluginDirectory}lib`) + '/';
        console.log(path);
        return path;
	}
}