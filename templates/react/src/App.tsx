import { CloseOutlined } from "@ant-design/icons";
import {
	Button,
	Checkbox,
	ConfigProvider,
	Flex,
	Image,
	Input,
	Progress,
	Space,
	Typography,
} from "antd";
import { useState } from "react";
import "./App.css";
import Header from "./components/Header";
import useInstallError from "./hooks/useInstallError";
import useInstallProgress from "./hooks/useInstallProgress";
import { appQuit, changePath, installation, launch } from "./utils";
const { Text } = Typography;

function App() {
	const [installPath, setInstallPath] = useState(
		`C:\\Program Files (x86)\\Setuply`,
	);

	const { error, reset: resetInstallError } = useInstallError();

	const { progress, reset: resetInstallProgress } = useInstallProgress();

	const startInstall = async () => {
		try {
			resetInstallError();
			resetInstallProgress();

			const path = await installation({
				packageDownloadUrl: "Your package url",
				packageFilename: "file.zip",
				installPath,
				setting: {
					// reg: {
					// 	displayName: "setuply(1.0.0)",
					// 	displayVersion: "1.0.0",
					// 	publisher: "phaoer",
					// 	installLocation: `${installPath}\\setuply.exe`,
					// 	uninstallString: `${installPath}\\Uninstall.exe`,
					// },
					// Create application shortcut
					// shortCut: {
					// 	targetPath: `${installPath}\\setuply.exe`,
					// 	shortcutName: "Setuply",
					// 	workingDir: installPath,
					// 	description: "setuply",
					// },
				},
			});

			console.log(path);
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<ConfigProvider
			theme={{
				token: {
					colorPrimary: "#00ca9d",
				},
			}}
		>
			<Flex vertical className="demo">
				<Header
					render={() => {
						return (
							<Flex
								justify="space-between"
								align="center"
								className="demo__header"
								data-tauri-drag-region
							>
								<div className="demo__header__text">Setuply-installer</div>

								<CloseOutlined
									className="demo__header__close"
									color="#fff"
									onClick={appQuit}
								/>
							</Flex>
						);
					}}
				/>

				<Flex justify="center" className="demo__logo">
					<Image src="/logo.png" preview={false} alt="setuply" width={200} />
				</Flex>

				{error === undefined ? (
					<>
						{progress === undefined ? (
							<Flex
								vertical
								justify="space-between"
								align="center"
								className="demo__body"
							>
								<Flex justify="center" className="demo__body__install">
									<Button type="primary" size="large" onClick={startInstall}>
										Installation
									</Button>
								</Flex>

								<Flex
									justify="space-between"
									align="center"
									style={{
										width: "100%",
									}}
								>
									<Flex align="center" gap={5}>
										<Checkbox checked></Checkbox>

										<Text
											type="secondary"
											style={{
												fontSize: 12,
											}}
										>
											Agree
										</Text>
									</Flex>

									<Space.Compact>
										<Input
											prefix="Path:"
											value={installPath}
											onChange={(e) => setInstallPath(e.target.value)}
											style={{
												width: 350,
												fontSize: 12,
												color: "#687486",
											}}
										/>
										<Button
											type="primary"
											onClick={async () => {
												try {
													const path = await changePath();

													if (!path) return;

													setInstallPath(path);
												} catch (error) {
													console.error("change path error", error);
												}
											}}
										>
											Change Path
										</Button>
									</Space.Compact>
								</Flex>
							</Flex>
						) : progress === 100 ? (
							<Flex
								vertical
								justify="space-between"
								align="center"
								className="demo__body"
							>
								<Text type="success">Installation successful</Text>
								<Button
									type="primary"
									size="large"
									onClick={() =>
										launch({
											exePath: `${installPath}\\AK.exe`,
										})
									}
								>
									Launch
								</Button>
							</Flex>
						) : (
							<Flex
								vertical
								justify="space-between"
								align="center"
								className="demo__body"
							>
								<Text type="success">Installing...</Text>
								<Progress percent={progress} />
							</Flex>
						)}
					</>
				) : (
					<Flex
						vertical
						justify="space-between"
						align="center"
						className="demo__body"
					>
						<Text type="danger">{error}</Text>
						<Button type="primary" size="large" onClick={startInstall}>
							Retry
						</Button>
					</Flex>
				)}
			</Flex>
		</ConfigProvider>
	);
}

export default App;
