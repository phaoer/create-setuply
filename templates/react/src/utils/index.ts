import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { open as shell } from "@tauri-apps/plugin-shell";
import type { InstallationParams, LaunchParams } from "../types";

/**
 * Exit the application.
 * @returns {Promise<any>} A promise that resolves when the application exits.
 */
export function appQuit(): Promise<any> {
	return invoke("quit");
}

/**
 * Invoke the native shell, commonly used to open URLs or external links.
 * @param {string} url - The target URL to open.
 * @returns {Promise<any>} A promise that resolves when the shell command is executed.
 */
export function openUrl(url: string): Promise<any> {
	return shell(url);
}

/**
 * Open a native file picker to select a local file or directory.
 * Commonly used to change the installation path.
 * @returns {Promise<string | null>} A promise that resolves with the selected path, or null if canceled.
 */
export function changePath(): Promise<string | null> {
	return open({
		multiple: false,
		directory: true,
	});
}

/**
 * Start the installation process.
 * @param {InstallationParams} params - Installation parameters.
 * @returns {Promise<string>} A promise that resolves with the installation result or status message.
 */
export function installation(params: InstallationParams): Promise<string> {
	return invoke("installation", params);
}

/**
 * Launch the installed application.
 * @param {LaunchParams} params - Launch parameters.
 * @returns {Promise<any>} A promise that resolves when the application starts.
 */
export function launch(params: LaunchParams): Promise<string> {
	return invoke("launch", params);
}
