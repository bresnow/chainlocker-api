import Gun from 'gun';
import chokidar from 'chokidar';
import lz from './lz-encrypt.js';
import glob from 'fast-glob';
import fs from 'fs/promises';
import 'gun/lib/path.js';
import 'gun/lib/load.js';
import 'gun/lib/open.js';
import 'gun/lib/then.js';
import path from 'path';
import Pair from './pair.js';
import lzString from 'lz-string';
import os from 'os';
export const getCID = async (vaultname, keypair) => lzString.compressToEncodedURIComponent((await Gun.SEA.work(vaultname, keypair)));
export async function SysUserPair(secret, opts) {
    let keys, workedImmutables;
    if (typeof Window === 'undefined') {
        let { username, platform, arch } = getImmutableMachineInfo();
        username = opts?.alias || username;
        let salt = secret
            ? Object.values({ username, platform, arch }).concat(...secret)
            : Object.values({ username, platform, arch });
        keys = await Pair({ username, platform, arch }, salt);
        workedImmutables = await Gun.SEA.work(salt, keys, null, {
            name: 'SHA-256',
            salt: { username, platform, arch }
        });
        return { keys, username, serial: workedImmutables };
    }
    else {
        let salt = secret ?? [], alias = opts?.alias || 'chainlocker';
        keys = await Pair(alias, salt);
        workedImmutables = await Gun.SEA.work(salt, keys, null, {
            name: 'SHA-256',
            salt: { alias }
        });
        return { keys, username: alias, serial: workedImmutables };
    }
}
export function getImmutableMachineInfo() {
    let username = os.userInfo().username, 
    // serial = sn.stdout.split(':')[1].trim(),
    platform = os.platform(), arch = os.arch();
    return { username, platform, arch };
}
Gun.chain.vault = function (vault, keys, cback) {
    let _gun = this;
    let gun = _gun.user();
    gun = gun.auth(keys, (ack) => {
        let err = ack.err;
        if (err) {
            throw new Error(err);
        }
        let lock = gun.get(vault);
        lock.once(async function (data) {
            let cID = await getCID(vault, keys);
            if (!data) {
                lock.put({ vault, vault_id: cID });
            }
            if (data) {
                let obj, tmp;
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
    _gun.locker = (nodepath) => {
        let path, temp = gun; // gets tricky with types but doable
        if (typeof nodepath === 'string') {
            path = nodepath.split('/' || '.');
            if (1 === path.length) {
                temp = temp.get(nodepath);
            }
            nodepath = path;
        }
        if (nodepath instanceof Array) {
            if (nodepath.length > 1) {
                var i = 0, l = nodepath.length;
                for (i; i < l; i++) {
                    if (typeof nodepath[i] === 'string' || typeof nodepath[i] === 'object') {
                        temp = temp.get(nodepath[i]);
                    }
                    if (typeof nodepath[i] === 'function') {
                        temp = temp.on(nodepath[i]());
                    }
                }
            }
            else {
                temp = temp.get(nodepath[0]);
            }
        }
        let node = temp;
        return {
            async put(data, cb2) {
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
                        let obj, tmp;
                        if (!data) {
                            cb({ err: 'Record not found' });
                            resolve({ err: 'Record not found' });
                        }
                        else {
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
    let keypair;
    if (secret) {
        let sys = await SysUserPair(typeof secret === 'string' ? [secret] : [...secret]);
        keypair = sys.keys;
    }
    else {
        keypair = (await SysUserPair()).keys;
    }
    callback && callback(keypair);
    return keypair;
};
export function exists(path) {
    path = interpretPath(path);
    return fs.stat(path);
}
export function interpretPath(...args) {
    return path.join(process.cwd(), ...(args ?? ''));
}
export async function write(path, content, encoding = 'utf8') {
    path = interpretPath(path);
    return fs.writeFile(path, content, { encoding });
}
export async function read(path, encoding) {
    path = interpretPath(path);
    return fs.readFile(path, { encoding });
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
        .filter((line) => (!line.startsWith('#') && line.length > 0 ? line : null));
    let matches = await glob(what);
    let scoper = _gun.get(alias);
    try {
        let scope = chokidar.watch(matches, { persistent: true });
        const log = console.log;
        scope.on('all', (event, path) => {
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
            let data = { file: (await read(_path, encoding)), ext, size };
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
            let data = { file: (await read(_path, encoding)), ext, size };
            scoper.path(path).put(data);
            verbose && log(`File ${_path} has been changed`);
        })
            .on('unlink', async function (_path) {
            if (!exists(_path)) {
                verbose && log(`File ${_path} does not exist`);
                return;
            }
            let [path, ext] = _path.split('.');
            scoper.path(path).put(null);
            verbose && log(`File ${_path} has been removed`);
        });
        if (verbose) {
            scope
                ?.on('addDir', (path) => log(`Directory ${path} has been added`))
                .on('unlinkDir', (path) => log(`Directory ${path} has been removed`))
                .on('error', (error) => log(`Watcher error: ${error}`))
                .on('ready', () => log('Initial scan complete. Ready for changes'));
        }
    }
    catch (err) {
        console.log('If you want to use the scope feature, you must install `chokidar` by typing `npm i chokidar` in your terminal.');
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
            fs.mkdir(alias + '/' + _dir, { recursive: true });
            _gun.path(alias + '.' + dir).once(async (data) => {
                if (data) {
                    let { file, ext, size } = data;
                    await write(alias + '/' + dir + '.' + ext, file, encoding);
                    log(`File ${dir} has been unpacked. size: ${size}`);
                }
                else {
                    log(`File data for ${dir} does not exist`);
                }
            });
        });
    });
};
