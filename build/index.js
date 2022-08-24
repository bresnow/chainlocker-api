import Gun from 'gun';
import chokidar from 'chokidar';
import { glob, chalk } from 'zx';
import { writeFileSync } from 'fs';
import fs from 'fs/promises';
import os from 'os';
import lz from './lz-encrypt.js';
import 'gun/lib/path.js';
import 'gun/lib/load.js';
import 'gun/lib/open.js';
import 'gun/lib/then.js';
import lzString from 'lz-string';
import Pair from './pair.js';
export const getCID = async (vaultname, keypair) => lzString.compressToEncodedURIComponent((await Gun.SEA.work(vaultname, keypair)));
const SEA = Gun.SEA;
export async function SysUserPair(secret) {
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
                    temp = temp.get(nodepath[i]);
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
            async value(cb) {
                node.once(async (data) => {
                    let obj, tmp;
                    if (!data) {
                        return cb({ err: 'Record not found' });
                    }
                    else {
                        tmp = data._;
                        delete data._;
                        obj = await lz.decrypt(data, keys);
                        cb({ _: tmp, ...obj });
                    }
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
/**
 * Scope watches the files in a directory and stores them in rad. No separate .ignore files as it uses the .gitignore file already in your current directory.
 * @param {string[]}what Glob pattern to watch
 * @param {callback(event, path, stats):void}callback Callback function to fire when a file or directory is added, changed, or removed
 * A fork of the HUB library... https://gun.eco/docs/hub.js#options
 * TODO: Broadcast files via relay server
 * TODO: ChainLocker
 */
let { username } = os.userInfo();
Gun.chain.scope = async function (what, callback, { verbose, alias, encoding }) {
    let _gun = this;
    verbose = verbose ?? true;
    alias = alias ?? username;
    let matches = await glob(what, { gitignore: true });
    let keys = await _gun.keys([...what, alias]);
    let { pub } = keys, soul = `__${pub}`;
    _gun.vault('scope', keys);
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
            .on('add', async function (path) {
            if (!fs.stat(path)) {
                verbose && log(chalk.red(`File ${path} does not exist`));
                return;
            }
            let nodepath = path.includes('/') ? path.split('/').map((x) => x.trim()) : [path];
            let name = nodepath.length > 1 ? nodepath.at(nodepath.length - 1) : nodepath[0];
            nodepath.pop() && nodepath.pop();
            if (nodepath && name) {
                console.log(chalk.green(`scope add : ${name}`));
                _gun.locker(nodepath)
                    .put({ [name]: await fs.readFile(path, encoding) });
                verbose && log(chalk.green(`File ${path} has been added`));
            }
            else {
                log(chalk.red(`Error adding file ${path}`));
                return;
            }
        })
            .on('change', async function (path) {
            if (!fs.stat(path)) {
                verbose && log(chalk.red(`File ${path} does not exist`));
                return;
            }
            let nodepath = path.includes('/') ? path.split('/').map((x) => x.trim()) : [path.trim()];
            let name = nodepath.length > 1 ? nodepath.at(nodepath.length - 1) : nodepath[0];
            nodepath.pop() && nodepath.pop();
            if (nodepath && name) {
                _gun
                    .locker(nodepath)
                    .put({ [name]: fs.readFile(path) });
                verbose &&
                    _gun
                        .locker(nodepath)
                        .value((d) => {
                        log('PATH\n' + chalk.green(d._['#']));
                    });
                verbose && log(chalk.green(`File ${path} has been changed`));
            }
            else {
                log(chalk.red(`Error onChange for ${path}`));
                return;
            }
        })
            .on('unlink', async function (path) {
            if (!fs.stat(path)) {
                verbose && log(chalk.red(`File ${path} does not exist`));
                return;
            }
            let nodepath = path.includes('/') ? path.split('/').map((x) => x.trim()) : [path];
            let name = nodepath.length > 1 ? nodepath.at(nodepath.length - 1) : nodepath[0];
            nodepath.pop() && nodepath.pop();
            if (nodepath && name) {
                _gun.locker([...nodepath, name])
                    .put(null);
                verbose && log(chalk.green(`File ${path} has been removed`));
            }
            else {
                log(chalk.red(`Error deleting file ${path}`));
                return;
            }
        });
        if (verbose) {
            scope
                ?.on('addDir', (path) => log(chalk.magenta(`Directory ${path} has been added`)))
                .on('unlinkDir', (path) => log(chalk.magenta(`Directory ${path} has been removed`)))
                .on('error', (error) => log(chalk.magenta(`Watcher error: ${error}`)))
                .on('ready', () => log(chalk.magenta('Initial scan complete. Ready for changes')));
        }
    }
    catch (err) {
        console.log(chalk.red('If you want to use the scope feature, you must install `chokidar` by typing `npm i chokidar` in your terminal.'));
    }
};
/**
 *
 * @param directory The directory to unpack files to
 * @param callback
 */
Gun.chain.unpack = async function (what, callback, opts) {
    let { alias, encoding } = opts ?? {};
    let _gun = this;
    let keys = await _gun.keys([...what, alias]);
    let { pub } = keys, soul = `__${pub}`;
    let matches = await glob(what, { gitignore: true });
    matches.forEach((path) => {
        _gun.vault('scope', keys);
        let nodepath = path.includes('/') ? path.split('/').map((x) => x.trim()) : [path];
        let name = nodepath.length > 1 ? nodepath.at(nodepath.length - 1) : nodepath[0];
        if (nodepath) {
            nodepath.pop() && nodepath.pop();
            _gun.locker(path.split('/').map((x) => x.trim())).value(file => {
                if (file && name) {
                    callback && callback(file);
                    writeFileSync(file._['#'], encoding ?? "utf-8");
                }
            });
        }
    });
};
