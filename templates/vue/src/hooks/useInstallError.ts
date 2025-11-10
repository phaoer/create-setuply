import { listen } from "@tauri-apps/api/event";
import { onMounted, onUnmounted, ref } from "vue";

/**
 * A Vue composable that provides error information during the installation process.
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
	const error = ref<string | undefined>(undefined);
	let unlisten: any;

	onMounted(async () => {
		// Listen for "test" event from Tauri backend
		unlisten = await listen<{ msg: string }>("install-error", (event) => {
			const { msg } = event.payload ?? {};
			error.value = msg;
		});
	});

	onUnmounted(() => {
		if (unlisten) unlisten();
	});

	const reset = () => {
		error.value = undefined;
	};

	return { error, reset };
}
