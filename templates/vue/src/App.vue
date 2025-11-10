<template>
	<a-config-provider
		:theme="{
			token: { colorPrimary: '#00ca9d' },
		}"
	>
		<div class="demo">
			<div
				class="demo__header"
				data-tauri-drag-region
				style="
					display: flex;
					justify-content: space-between;
					align-items: center;
				"
			>
				<div class="demo__header__text">Setuply-installer</div>
				<CloseOutlined class="demo__header__close" @click="appQuit" />
			</div>

			<div class="demo__logo" style="display: flex; justify-content: center">
				<a-image src="/logo.png" :preview="false" alt="setuply" :width="200" />
			</div>

			<template v-if="error === undefined">
				<template v-if="progress === undefined">
					<div
						class="demo__body"
						style="
							display: flex;
							flex-direction: column;
							align-items: center;
							justify-content: space-between;
						"
					>
						<div class="demo__body__install" style="text-align: center">
							<a-button type="primary" size="large" @click="startInstall">
								Installation
							</a-button>
						</div>

						<div
							style="
								width: 100%;
								display: flex;
								justify-content: space-between;
								align-items: center;
							"
						>
							<div style="display: flex; align-items: center; gap: 5px">
								<a-checkbox checked />
								<a-typography-text type="secondary" style="font-size: 12px">
									Agree
								</a-typography-text>
							</div>

							<a-space-compact>
								<a-input
									prefix="Path:"
									v-model:value="installPath"
									style="width: 350px; font-size: 12px; color: #687486"
								/>
								<a-button type="primary" @click="onChangePath">
									Change Path
								</a-button>
							</a-space-compact>
						</div>
					</div>
				</template>

				<template v-else-if="progress === 100">
					<div
						class="demo__body"
						style="
							display: flex;
							flex-direction: column;
							align-items: center;
							justify-content: space-between;
						"
					>
						<a-typography-text type="success"
							>Installation successful</a-typography-text
						>
						<a-button
							type="primary"
							size="large"
							@click="launch({ exePath: `${installPath}\\AK.exe` })"
						>
							Launch
						</a-button>
					</div>
				</template>

				<template v-else>
					<div
						class="demo__body"
						style="
							display: flex;
							flex-direction: column;
							align-items: center;
							justify-content: space-between;
						"
					>
						<a-typography-text type="success">Installing...</a-typography-text>
						<a-progress :percent="progress" />
					</div>
				</template>
			</template>

			<template v-else>
				<div
					class="demo__body"
					style="
						display: flex;
						flex-direction: column;
						align-items: center;
						justify-content: space-between;
					"
				>
					<a-typography-text type="danger">{{ error }}</a-typography-text>
					<a-button type="primary" size="large" @click="startInstall">
						Retry
					</a-button>
				</div>
			</template>
		</div>
	</a-config-provider>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { CloseOutlined } from "@ant-design/icons-vue";
import { appQuit, changePath, installation, launch } from "./utils";
import useInstallError from "./hooks/useInstallError";
import useInstallProgress from "./hooks/useInstallProgress";

const { error, reset: resetInstallError } = useInstallError();

const { progress, reset: resetInstallProgress } = useInstallProgress();

const installPath = ref("C:\\Program Files\\Setuply");

const startInstall = async () => {
	try {
		resetInstallError();
		resetInstallProgress();

		const path = await installation({
				packageDownloadUrl: "Your package url",
				packageFilename: "file.zip",
				installPath: installPath.value,
				// setting: {
				// 	reg: {
				// 		displayName: "setuply(1.0.0)",
				// 		displayVersion: "1.0.0",
				// 		publisher: "phaoer",
				// 		installLocation: `${installPath.value}\\setuply.exe`,
				// 		uninstallString: `${installPath.value}\\Uninstall.exe`,
				// 	},
				// 	shortCut: {
				// 		targetPath: `${installPath.value}\\setuply.exe`,
				// 		shortcutName: "Setuply",
				// 		workingDir: installPath.value,
				// 		description: "setuply",
				// 	},
				// },
		});

		console.log(path);
	} catch (error) {
		console.error("install error: ", error);
	}
};

const onChangePath = async () => {
	try {
		const path = await changePath();

		if (!path) return;

		installPath.value = path;
	} catch (error) {
		console.error("change path error: ", error);
	}
};
</script>

<style>
:root {
	font-family: Inter, Avenir, Helvetica, Arial, sans-serif;
	font-size: 16px;
	line-height: 24px;
	font-weight: 400;
	font-synthesis: none;
	text-rendering: optimizeLegibility;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	-webkit-text-size-adjust: 100%;
}

* {
	margin: 0;
	padding: 0;
	box-sizing: border-box;
}

html,
body {
	height: 100%;
}

#root {
	height: 100%;
}

.demo__header {
	height: 40px;
	padding: 0 12px;
}

.demo__header__text {
	font-size: 14px;
	color: #474a4f;
}

.demo__logo {
	margin-bottom: 20px;
}

.demo__body {
	height: 120px;
	padding: 0 20px 0;
}
</style>
