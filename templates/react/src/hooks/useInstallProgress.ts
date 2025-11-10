import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";

/**
 * A React hook that provides the current installation progress.
 *
 * @returns {{
 *   progress: number;
 *   reset: () => void;
 * }} 
 * Returns an object containing:
 * - `progress`: The current installation progress (0–100).
 * - `reset`: A function to reset the progress state.
 */
export default function useInstallProgress() {
	const [progress, setProgress] = useState<number | undefined>(undefined);

	useEffect(() => {
		let unlisten: any;

		const addListen = async () => {
			unlisten = await listen<{
				progress: number;
			}>("install-progress", (event) => {
				console.log(event);
				
				const { progress } = event.payload ?? {};

				setProgress(progress);
			});
		};

		addListen();

		return () => {
			unlisten?.();
		};
	}, []);

	return { progress, reset: () => setProgress(undefined) };
}
