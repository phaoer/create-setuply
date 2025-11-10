import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";

/**
 * A React hook that provides error information during the installation process.
 *
 * @returns {{
 *   error: string;
 *   reset: () => void;
 * }}
 * Returns an object containing:
 * - `error`: The current installation error message.
 * - `reset`: A function to clear the error state.
 */
export default function useInstallError() {
	const [error, setError] = useState<string | undefined>(undefined);

	useEffect(() => {
		let unlisten: any;

		const addListen = async () => {
			unlisten = await listen<{
				msg: string;
			}>("install-error", (event) => {
				const { msg } = event.payload ?? {};

				setError(msg);
			});
		};

		addListen();

		return () => {
			unlisten?.();
		};
	}, []);

	return { error, reset: () => setError(undefined)};
}
