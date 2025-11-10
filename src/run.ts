import chalk from "chalk";
import path from "path";
import { fileURLToPath } from "url";
import { createEnv } from "yeoman-environment";

export default async function run() {
	try {
		const env = createEnv();

		env.register(
			path.join(path.dirname(fileURLToPath(import.meta.url)), "./index.js"),
			{
				namespace: "generator-setuply",
			},
		);

		await env.run(["generator-setuply"], { "skip-install": true });
	} catch (error) {
		console.error(chalk.red(`${error}`));
	}
}
