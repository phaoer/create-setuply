export type InstallationParams = {
	packageDownloadUrl: string;
	packageFilename: string;
	installPath: string;
	setting?: {
		reg?: {
			displayName: string;
			displayVersion: string;
			publisher: string;
			installLocation: string;
			uninstallString: string;
		};
		shortCut?: {
			targetPath: string;
			shortcutName: string;
			workingDir: string;
			description: string;
		};
	};
};

export type LaunchParams = {
	exePath: string;
};

export type DownloadProgress = {
	progress: number;
};

export type InstallationError = {
	msg: string;
};
