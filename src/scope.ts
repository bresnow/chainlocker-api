import Gun from 'gun';
import chokidar from 'chokidar';
import glob from 'fast-glob';
import fs from 'fs-extra';
import 'gun/lib/path.js';
import 'gun/lib/load.js';
import 'gun/lib/open.js';
import 'gun/lib/then.js';
import path from 'path';
export function exists(path: string) {
	path = interpretPath(path);
	return fs.existsSync(path);
}

const SEA = Gun.SEA;
export function interpretPath(...args: string[]): string {
	return path.join(process.cwd(), ...(args ?? ''));
}

export async function write(path: any, content: string, encoding: BufferEncoding = 'utf8') {
	path = interpretPath(path);
	return fs.writeFile(path, content, { encoding });
}

export async function read(path: string, encoding?: BufferEncoding) {
	path = interpretPath(path);
	return fs.readFile(path, encoding ?? 'utf8');
}
/**
 * Scope watches the files in a directory and stores them in rad. No separate .ignore files as it uses the .gitignore file already in your current directory.
 * @param {string[]}what Glob pattern to watch
 * @param {callback(event, path, stats):void}callback Callback function to fire when a file or directory is added, changed, or removed
 * A fork of the HUB library... https://gun.eco/docs/hub.js#options
 * TODO: Broadcast files via relay server
 * TODO: ChainLocker
 */

Gun.chain.scope = async function (what, callback, { verbose, alias, encoding = 'utf8' }) {
	let _gun = this;
	verbose = verbose ?? true;
	alias = alias ?? 'scope';
	let ignore = (await read('.gitignore'))
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => !line.startsWith('#') && line.length > 0);

	let matches = await glob(what, { ignore: [...ignore] });
	let scoper = _gun.get(alias);
	try {
		let scope = chokidar.watch(matches, { persistent: true });
		const log = console.log;
		scope.on('all', (event, path) => {
			let fileOpts = { path, matches, event };
			if (callback) {
				callback(path, event, matches);
				if (verbose) {
					log(`scope callback fired : ${event} ${path}`);
				}
			}
		});
		scope
			.on('add', async function (_path, stats) {
				if (!exists(_path) || !stats?.isFile()) {
					verbose && log(`File ${_path} does not exist`);
					return;
				}
				let [path, ext] = _path.split('.');
				let { size } = stats;
				let data = { file: await read(_path, encoding), ext, size };

				scoper.path(path).put(data);
				verbose && log(`File ${_path} has been added`);
			})
			.on('change', async function (_path, stats) {
				if (!exists(_path) || !stats?.isFile()) {
					verbose && log(`File ${_path} does not exist`);
					return;
				}
				let [path, ext] = _path.split('.');
				let { size } = stats;
				let data = { file: await read(_path, encoding), ext, size };

				scoper.path(path).put(data);

				verbose && log(`File ${_path} has been changed`);
			})
			.on('unlink', async function (_path) {
				if (!exists(_path)) {
					verbose && log(`File ${_path} does not exist`);
					return;
				}
				let [path, ext] = _path.split('.');
				scoper.path(path).put(null as any);
				verbose && log(`File ${_path} has been removed`);
			});
		if (verbose) {
			scope
				?.on('addDir', (path) => log(`Directory ${path} has been added`))
				.on('unlinkDir', (path) => log(`Directory ${path} has been removed`))
				.on('error', (error) => log(`Watcher error: ${error}`))
				.on('ready', () => log('Initial scan complete. Ready for changes'));
		}
	} catch (err) {
		console.log(
			'If you want to use the scope feature, you must install `chokidar` by typing `npm i chokidar` in your terminal.'
		);
	}
};
/**
 *
 * @param alias The node location and directory to unpack files into
 * @param encoding The encoding to use when reading files
 * @param encryption The encryption keypair to use when encrypting files
 */
Gun.chain.unpack = async function ({ alias, encoding }) {
	const log = console.log;
	alias = alias || 'scope';
	encoding = encoding ?? 'utf8';

	let _gun = this;
	let scoper = _gun.get(alias);
	scoper.on((dirs) => {
		delete dirs._;
		Object.keys(dirs).forEach((dir) => {
			let _dir = dir.slice(0, dir.lastIndexOf('/'));
			fs.mkdirpSync(alias + '/' + _dir);
			_gun.path(alias + '.' + dir).once(async (data) => {
				if (data) {
					let { file, ext, size } = data;
					await write(alias + '/' + dir + '.' + ext, file, encoding);
					log(`File ${dir} has been unpacked. size: ${size}`);
				} else {
					log(`File data for ${dir} does not exist`);
				}
			});
		});
	});
};
