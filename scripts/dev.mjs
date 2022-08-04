import Gun from 'gun';
import '../bin/cli/lib/chain-hooks/scope.mjs';
import 'gun/lib/path.js';
import esbuild from 'esbuild';
import { $, chalk } from 'zx';

const gun = Gun({ file: 'scope' });
export default async function Dev() {
	await $`cat scope/! > scope/dev_data.json`;
	gun.scope(
		['**/*.mts'],
		async function (path, event, matches) {
			if (event === ('change' || 'unlink')) {
				console.clear();
				console.log(chalk.cyan(`${path} ${event === 'change' ? 'changed' : 'removed'}`));
				console.log(chalk.yellow.bold(`Rebuilding...`));
				let file = path;
				if (file === 'cli/types.mts') {
					return;
				}
				esbuild
					.build({
						entryPoints: [file],
						outfile: `bin/${file.replace('ts', 'js')}`,
						bundle: false,
						platform: 'node'
					})
					.then(async () => {
						console.log(chalk.green.bold(`${file} rebuilt`));
						await Dev();
					});
			}
		},
		{ verbose: false }
	);
}

await Dev();
