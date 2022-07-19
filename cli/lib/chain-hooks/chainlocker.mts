import Gun, { GunSchema, IGunChain, IGunInstance, IGunInstanceRoot, IGunUserInstance, ISEAPair } from 'gun'
import { SysUserPair, MASTER_KEYS, MASTER_SERIAL } from '../auth.mjs'
import lz from '../lz-encrypt.mjs'
import lzString from 'lz-string'
import { lzObject } from 'lz-object'
import { exists, interpretPath, read } from '../file-utils.mjs'
import { err, warn } from '../debug.mjs'
import 'gun/lib/path.js'
import 'gun/lib/load.js'
import 'gun/lib/open.js'
import 'gun/lib/then.js'
import config from '../../../config/index.mjs'
const SEA = Gun.SEA
declare module 'gun/types' {
  export interface IGunInstance<TNode> {
    /**
     * Create a new vault in the chain.
     *
     * Takes the lockername and generates the keys against machine info.
     * Should require sudo privilages to create a new vault.
     *
     */
    vault(vaultname: string, cb?: CallBack, options?: VaultOpts): IGunInstance<TNode>
    locker(nodepath: string | string[]): {
      value(cb: CallBack): Promise<void>
      put(data: any, cb: CallBack): Promise<void>
      keys(secret: string | string[]): Promise<ISEAPair>
    }
    keys(secret: string | string[]): Promise<ISEAPair>
  }
}

export type CallBack = (...ack: any) => void
export type VaultOpts = { keys: ISEAPair; encoding?: 'utf16' | 'uint8array' | 'base64' | 'uri' }

export const getCID = async (vaultname: string, keypair: ISEAPair) =>
  lzString.compressToEncodedURIComponent((await Gun.SEA.work(vaultname, keypair)) as string)
Gun.chain.vault = function (vault, cb, opts) {
  let _gun = this
  let gun = _gun.user()
  let keys = opts?.keys || MASTER_KEYS // can use the master key made from the machine serial or bring your own keys
  gun.auth(keys, (ack: any) => {
    if (!ack.err) {
      let vnode = gun.get(`CHAINLOCKER`).get(vault)
      vnode.once(async (data) => {
        let cID = await getCID(vault, keys)
        let now = Date.now()
        if (!data) {
          vnode.put({ created: now, auth: cID })
        }
        vnode.once((data) => {
          if (data) {
            if (data.auth !== cID) {
              cb && cb({ err: `Vault ${vault} is not authorized` })
            } else {
              vnode.put({ last_auth: now })
              cb && cb(data)
            }
          }
        })
      })
    } else {
      console.error(ack.err)
    }
  })
  _gun.locker = (nodepath) => {
    let path,
      temp = _gun.user().auth(keys) // gets tricky with types but doable
    if (typeof nodepath === 'string') {
      path = nodepath.split('/' || '.')
      if (1 === path.length) {
        temp = temp.get(nodepath)
      }
      nodepath = path
    }
    if (nodepath instanceof Array) {
      if (nodepath.length > 1) {
        var i = 0,
          l = nodepath.length
        for (i; i < l; i++) {
          temp = temp.get(nodepath[i])
        }
      } else {
        temp = temp.get(nodepath[0])
      }
    }
    let node = temp
    return {
      async put(data, cb2) {
        if (typeof data !== 'object') {
          err('data must be an object')
        } else {
          data = await lz.encrypt(data, keys, { encoding: opts?.encoding ?? 'utf16' })
          node.put(data, cb2)
        }
      },
      async value(cb) {
        node.load(async (data: any) => {
          let obj
          if (!data) {
            return cb({ err: 'Record not found' })
          } else {
            obj = await lz.decrypt(data, keys, { encoding: opts?.encoding ?? 'utf16' })
            cb(obj)
          }
        })
      },
      async keys(secret) {
        // can add secret string, username and password, or an array of secret strings
        let { keys } = await SysUserPair(typeof secret === 'string' ? [vault, secret] : [vault, ...secret])
        return keys
      },
    }
  }
  return _gun //return gun user instance
}

Gun.chain.keys = async function (secret) {
  // can add secret string, username and password, or an array of secret strings
  let { keys } = await SysUserPair(typeof secret === 'string' ? [secret] : secret)
  return keys
}
