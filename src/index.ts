import Gun, { GunMessagePut, IGunChain, IGunInstanceRoot, IGunUserInstance, ISEAPair } from 'gun';
import chokidar from 'chokidar';
import { glob, chalk } from 'zx';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import lz from './lz-encrypt.js';
import 'gun/lib/path.js';
import 'gun/lib/load.js';
import 'gun/lib/open.js';
import 'gun/lib/then.js';
import lzString from 'lz-string';
import Pair from './pair.js';
export function exists(path: string) {
	path = interpretPath(path);
	return fs.existsSync(path);
}
export const getCID = async (vaultname: string, keypair: ISEAPair) =>
	lzString.compressToEncodedURIComponent((await Gun.SEA.work(vaultname, keypair)) as string);
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
declare module 'gun/types' {
	interface IGunInstance<TNode> extends IGunUserInstance {
		/**
		 * Create a new vault context.
		 *
		 * Takes the lockername and generates the keys against machine info.
		 * Should require sudo privilages to create a new vault.
		 *
		 */
		vault(
			vaultname: string,
			keys: ISEAPair,
			cb?: CallBack
		): IGunUserInstance<any, any, any, IGunInstanceRoot<any, IGunInstance<any>>>;
		/**
		 * Get a locker instance for a node in the chain.
		 *
		 * @param {string}
		 */
		locker(nodepath: string | string[]): {
			value(cb: CallBack): Promise<Record<string, any>>;
			put(data: string | Record<string, any> | undefined, cb?: CallBack): Promise<void>;
		};
		keys(secret?: string | string[], callback?: CallBack): Promise<ISEAPair>;
	}
	interface IGunChain<TNode> extends IGunInstance {
		scope(
			what: string[],
			callback: ScopeCb | undefined,
			opts: {
				verbose?: boolean;
				alias?: string;
				encoding?: BufferEncoding | undefined;
			}
		): Promise<void>;

		unpack(opts: { alias?: string; encoding: BufferEncoding | undefined }): Promise<void>;
	}
}
export declare type ScopeCb = (
	path?: string,
	event?: 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir',
	matches?: string[]
) => void;
export declare type CallBack = (...ack: any) => void;
export declare type VaultOpts = {
	keys: ISEAPair;
	encoding?: 'utf16' | 'base64' | 'uint8array' | 'uri';
};

export async function SysUserPair(secret?: string[]) {
	let { username, platform, arch } = getImmutableMachineInfo();
	let salt = secret
		? Object.values({ username, platform, arch }).concat(...secret)
		: Object.values({ username, platform, arch });
	let keys = await Pair({ username, platform, arch }, salt);
	let workedImmutables = await Gun.SEA.work({ username, platform, arch }, keys, null, {
		name: 'SHA-256',
		salt
	});
	return { keys, username, serial: workedImmutables };
}
export function getImmutableMachineInfo() {
	let username = os.userInfo().username,
		// serial = sn.stdout.split(':')[1].trim(),
		platform = os.platform(),
		arch = os.arch();
	return { username, platform, arch };
}

Gun.chain.vault = function (vault, keys, cback) {
	let _gun = this;
	let gun = _gun.user();
	gun = gun.auth(keys, (ack: any) => {
		let err = (ack as any).err;
		if (err) {
			throw new Error(err);
		}
		let lock = gun.get(vault);
		lock.once(async function (data: { _: any }) {
			let cID = await getCID(vault, keys);
			if (!data) {
				lock.put({ vault, vault_id: cID });
			}
			if (data) {
				let obj: { vault: any; vault_id: string }, tmp: any;
				tmp = data._;
				delete data._;
				obj = await lz.decrypt(data, keys);
				if (obj.vault && obj.vault_id !== cID) {
					//check POW hashes to make sure they match
					throw new Error(`Err authenticating ${vault}`);
				}
				cback && cback({ _: tmp, chainlocker: obj, gun: ack });
			}
		});
	});

	_gun.locker = (nodepath: string | any[]) => {
		let path: string | any[],
			temp = gun as unknown as IGunChain<any>; // gets tricky with types but doable
		if (typeof nodepath === 'string') {
			path = nodepath.split('/' || '.');
			if (1 === path.length) {
				temp = temp.get(nodepath);
			}
			nodepath = path;
		}
		if (nodepath instanceof Array) {
			if (nodepath.length > 1) {
				var i = 0,
					l = nodepath.length;
				for (i; i < l; i++) {
					temp = temp.get(nodepath[i]);
				}
			} else {
				temp = temp.get(nodepath[0]);
			}
		}
		let node = temp;
		return {
			async put(
				data: string | Record<string, any> | undefined,
				cb2: (arg0: GunMessagePut) => void
			) {
				data = await lz.encrypt(data, keys);
				node.put(data, (ack) => {
					if (cb2) {
						cb2(ack);
					}
				});
			},
			value(cb) {
				return new Promise((resolve) => {
					node.once(async (data) => {
						let obj: any, tmp: any;
						if (!data) {
							cb({ err: 'Record not found' });
							resolve({ err: 'Record not found' });
						} else {
							tmp = data._;
							delete data._;
							obj = await lz.decrypt(data, keys);
							cb({ _: tmp, ...obj });
							resolve({ _: tmp, ...obj });
						}
					});
				});
			}
		};
	};

	return gun; //return gun user instance
};

Gun.chain.keys = async function (secret, callback) {
	// can add secret string, username and password, or an array of secret strings\
	let keypair: ISEAPair | PromiseLike<ISEAPair>;
	if (secret) {
		let sys = await SysUserPair(typeof secret === 'string' ? [secret] : [...secret]);
		keypair = sys.keys;
	} else {
		keypair = (await SysUserPair()).keys;
	}
	callback && callback(keypair);
	return keypair;
};

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
	let matches = await glob(what, { gitignore: true });
	let scoper = _gun.get(alias);
	try {
		let scope = chokidar.watch(matches, { persistent: true });
		const log = console.log;
		scope.on('all', (event, path) => {
			let fileOpts = { path, matches, event };
			if (callback) {
				callback(path, event, matches);
				if (verbose) {
					log(chalk.green(`scope callback fired : ${event} ${path}`));
				}
			}
		});
		scope
			.on('add', async function (_path, stats) {
				if (!exists(_path) || !stats?.isFile()) {
					verbose && log(chalk.red(`File ${_path} does not exist`));
					return;
				}
				let [path, ext] = _path.split('.');
				let { size } = stats;
				let data = { file: await read(_path, encoding), ext, size };

				scoper.path(path).put(data);
				verbose && log(chalk.green(`File ${_path} has been added`));
			})
			.on('change', async function (_path, stats) {
				if (!exists(_path) || !stats?.isFile()) {
					verbose && log(chalk.red(`File ${_path} does not exist`));
					return;
				}
				let [path, ext] = _path.split('.');
				let { size } = stats;
				let data = { file: await read(_path, encoding), ext, size };

				scoper.path(path).put(data);

				verbose && log(chalk.green(`File ${_path} has been changed`));
			})
			.on('unlink', async function (_path) {
				if (!exists(_path)) {
					verbose && log(chalk.red(`File ${_path} does not exist`));
					return;
				}
				let [path, ext] = _path.split('.');
				scoper.path(path).put(null as any);
				verbose && log(chalk.green(`File ${_path} has been removed`));
			});
		if (verbose) {
			scope
				?.on('addDir', (path) => log(chalk.magenta(`Directory ${path} has been added`)))
				.on('unlinkDir', (path) => log(chalk.magenta(`Directory ${path} has been removed`)))
				.on('error', (error) => log(chalk.magenta(`Watcher error: ${error}`)))
				.on('ready', () => log(chalk.magenta('Initial scan complete. Ready for changes')));
		}
	} catch (err) {
		console.log(
			chalk.red(
				'If you want to use the scope feature, you must install `chokidar` by typing `npm i chokidar` in your terminal.'
			)
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
					log(chalk.green(`File ${dir} has been unpacked. size: ${size}`));
				} else {
					log(chalk.red(`File data for ${dir} does not exist`));
				}
			});
		});
	});
};
