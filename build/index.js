import Gun from 'gun';
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
        let lock = gun.get(`chainlocker`);
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
