#!/usr/bin/env node

import chalk from "chalk";
import { exec } from "child_process";
import semver from "semver";
import run from "../run.js";

const versionRange = "^20.19.0 || >=22.12.0";

if (!semver.satisfies(process.version, versionRange)) {
	console.error(
		chalk.red(
			`❌ The generator will only work with Node ${versionRange} and up!`,
		),
	);
	process.exit(1);
}

exec("rustc --version", (error, stdout, stderr) => {
	if (error) {
		console.log(
			chalk.red(
				`❌ Rust is not installed!\n${chalk.blue("   Please install Rust from: ")}${chalk.underline.green("https://www.rust-lang.org/tools/install")}`,
			),
		);

		process.exit(1);
	}

	console.log(chalk.green(`✅ Rust is installed: ${stdout.trim()}`));

	run();
});
