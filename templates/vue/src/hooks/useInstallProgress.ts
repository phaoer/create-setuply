import { listen } from "@tauri-apps/api/event";
import { onMounted, onUnmounted, ref } from "vue";

/**
 * A Vue composable that provides the current installation progress.
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
	const progress = ref<number | undefined>(undefined);
	let unlisten: any;

	onMounted(async () => {
		// Listen for "test" event from Tauri backend
		unlisten = await listen<{ msg: string }>("install-progress", (event) => {
			const payload: any = event.payload ?? {};
			progress.value = payload.progress;
		});
	});

	onUnmounted(() => {
		if (unlisten) unlisten();
	});

	const reset = () => {
		progress.value = undefined;
	};

	return { progress, reset };
}
