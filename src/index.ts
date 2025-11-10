import chalk from "chalk";
import { exec, spawn } from "child_process";
import Generator from "yeoman-generator";

export default class MyGenerator extends Generator {
	private props: Record<string, any> = {};

	constructor(args: string[], opts: Record<string, any>) {
		super(args, opts);
	}

	prompting() {
		return this.prompt([
			{
				type: "input",
				name: "projectName",
				message: "What is your project name?",
				default: "setuply-project",
			},
			{
				type: "input",
				name: "name",
				message: "What is your app name?",
				validate: (input) => {
					const value = input.trim();

					if (!value) return "Input cannot be empty";

					const regex = /^[A-Za-z0-9_]+$/;

					if (!regex.test(value)) {
						const invalidChars = [
							...new Set(value.replace(/[A-Za-z0-9_]/g, "").split("")),
						].join(" ");
						return `Invalid characters detected: ${invalidChars}. Only letters, numbers, and '_' are allowed.`;
					}

					return true;
				},
				default: "setuply_installer",
			},
			{
				type: "input",
				name: "identifier",
				message: "What is your app identifier?",
				validate(input) {
					const value = input.trim();

					if (!value) {
						return "Input cannot be empty";
					}

					const regex = /^[A-Za-z0-9.-]+$/;

					if (!regex.test(value)) {
						const invalidChars = [
							...new Set(value.replace(/[A-Za-z0-9.-]/g, "").split("")),
						]
							.filter(Boolean)
							.join(" ");

						return `❌ Invalid characters detected: ${invalidChars}. Only letters, numbers, '-' and '.' are allowed.`;
					}

					return true;
				},
				default: "com.setuply.setuply-installer",
			},
			{
				type: "input",
				name: "version",
				message: "What is your app version?",
				default: "1.0.0",
			},
			{
				type: "list",
				name: "template",
				message: "Choose your UI template?",
				choices: [
					{
						name: "React",
						value: "react",
					},
					{
						name: "Vue",
						value: "vue",
					},
				],
				default: "react",
			},
			{
				type: "list",
				name: "arch",
				message: "Choose you like to build for?",
				choices: [
					{
						name: "32-bit (x86)",
						value: "x86",
					},
					{
						name: "64-bit (x64)",
						value: "x64",
					},
				],
				default: "x86",
			},
		]).then((answers) => {
			this.props = answers;
		});
	}

	writing() {
		return new Promise((resolve) => {
			const { projectName, template, arch } = this.props;

			this.fs.copy(this.sourceRoot(), this.destinationPath(projectName), {
				globOptions: {
					ignore: [
						"**/react/**",
						"**/src-tauri/**",
						"**/vue/**",
						"**/vite.config.ts",
					],
					dot: true,
				},
			});

			this.fs.copyTpl(
				this.templatePath(`${template}`),
				this.destinationPath(projectName),
				{
					...this.props,
					target: arch === "x86" ? "-- --target i686-pc-windows-msvc" : "",
				},
			);

			this.fs.copyTpl(
				this.templatePath(`src-tauri`),
				this.destinationPath(`${projectName}/src-tauri`),
				{
					...this.props,
				},
			);

			this.fs.copyTpl(
				this.templatePath(`vite.config.ts`),
				this.destinationPath(`${projectName}/vite.config.ts`),
				{
					...this.props,
				},
			);

			if (arch === "x86") {
				exec("rustup show", (error, stdout) => {
					if (error) {
						console.log(
							chalk.red(
								`\n❌ check Rust toolchains error! Please check your Rust environment!`,
							),
						);

						this.props.needInstallI686 = true;

						resolve(true);

						return;
					}

					const data = stdout.trim();

					if (data.includes("i686-pc-windows-msvc")) {
						console.log(
							chalk.green(`\n✅ toolchains i686-pc-windows-msvc is installed!`),
						);

						this.props.needInstallI686 = false;

						resolve(true);

						return;
					}

					const child = spawn("rustup", [
						"target",
						"add",
						"i686-pc-windows-msvc",
					]);

					child.on("close", (code) => {
						if (code === 0) {
							console.log(
								chalk.green(
									`\n✅ toolchains i686-pc-windows-msvc installed success!`,
								),
							);

							this.props.needInstallI686 = false;

							resolve(true);
						}
					});

					child.on("error", (error) => {
						console.log(
							chalk.red(`\n❌ install Rust toolchains error: ${error}!`),
						);

						this.props.needInstallI686 = true;

						resolve(true);
					});
				});

				return;
			}

			resolve(true);
		});
	}

	end() {
		const { projectName, arch, needInstallI686 } = this.props;

		console.log(
			chalk.green(
				`\nTemplate created! To get started run:\n   cd ${projectName}\n   npm install\n\nFor development, run:\n   npm run dev:win\n\nFor build, run:\n   npm run build:win`,
			),
		);

		if (arch === "x86" && needInstallI686) {
			console.log(
				chalk.red(
					`\nBecause you need to build a 32-bit version, please run the command "rustup target add i686-pc-windows-msvc" manually in the command line.`,
				),
			);
		}
	}
}
