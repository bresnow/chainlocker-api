import Gun, { GunSchema, IGunChain, IGunInstance, IGunInstanceRoot, IGunUserInstance, ISEAPair } from 'gun'
import { SysUserPair, MASTER_KEYS, MASTER_SERIAL } from '../auth.mjs'
import lz from '../lz-encrypt.mjs'
import lzString from 'lz-string'
import { lzObject } from 'lz-object'
import { exists, interpretPath, read } from '../file-utils.mjs'
import { warn } from '../debug.mjs'
import 'gun/lib/path.js'
import 'gun/lib/load.js'
import 'gun/lib/open.js'
import 'gun/lib/then.js'
import config from '../../../config/index.mjs'
const SEA = Gun.SEA
declare module 'gun/types' {
  export interface IGunInstance<TNode> extends IGunUserInstance<TNode> {
    /**
     * Create a new vault context.
     *
     * Takes the lockername and generates the keys against machine info.
     * Should require sudo privilages to create a new vault.
     *
     */
    vault(vaultname: string, options?: VaultOpts): IGunUserInstance<any, any, any, IGunInstanceRoot<any, IGunInstance<any>>>
    /**
     * Get a locker instance for a node in the chain.
     *
     * @param {string}
     */
    locker(nodepath: string | string[]): { value(cb: CallBack): Promise<void>; put(data: any, cb: CallBack): Promise<void> }
    keys(secret?: string | string[]): Promise<ISEAPair>
  }
}

export type CallBack = (...ack: any) => void
export type VaultOpts = { keys: ISEAPair; encoding?: 'utf16' | 'base64' | 'uint8array' | 'uri' }

Gun.chain.vault = function (vault, opts) {
  let _gun = this
  let gun = _gun.user()
  let keys = opts?.keys ?? MASTER_KEYS // can use the master key made from the machine serial or bring your own keys
  gun = gun.auth(keys, (ack) => {
    let err = (ack as any).err
    if (err) {
      throw new Error(err)
    }
  })

  _gun.keys = async function (secret) {
    // can add secret string, username and password, or an array of secret strings\
    let keypair = MASTER_KEYS
    if (secret) {
      let sys = await SysUserPair(typeof secret === 'string' ? [secret] : [...secret])
      keypair = sys.keys
    }
    return keypair
  }
  _gun.locker = (nodepath) => {
    let path,
      temp = gun as unknown as IGunChain<any> // gets tricky with types but doable
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
        data = await lz.encrypt(data, keys)
        node.put(data, cb2)
      },
      async value(cb) {
        node.load(async (data: any) => {
          let obj
          if (!data) {
            return cb({ err: 'Record not found' })
          } else {
            obj = await lz.decrypt(data, keys)
            cb(obj)
          }
        })
      },
    }
  }
  return gun //return gun user instance
}
