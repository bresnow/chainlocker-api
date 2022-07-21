import Gun, { IGunChain } from 'gun'
import { SysUserPair, MASTER_KEYS } from '../auth.mjs'
import lz from '../lz-encrypt.mjs'
import 'gun/lib/path.js'
import 'gun/lib/load.js'
import 'gun/lib/open.js'
import 'gun/lib/then.js'
import config from '../../../config/index.mjs'
import { getCID } from '../../src/index.mjs'
const SEA = Gun.SEA

//TODO: FIX UINT8Array decompression

Gun.chain.vault = function (vault, cback, opts) {
  let _gun = this
  let gun = _gun.user()
  let keys = opts?.keys ?? MASTER_KEYS // can use the master key made from the machine serial or bring your own keys
  gun = gun.auth(keys, (ack) => {
    let err = (ack as any).err
    if (err) {
      throw new Error(err)
    }
    let lock = gun.get(`ChainLocker`)
    lock.once(async function (data) {
      let cID = await getCID(vault, keys)

      if (!data) {
        let _data = { vault, vault_id: cID, config: { rad_directory: config.radDir } }
        // vault data for when peered with another locker or Gun graph
        let encrypted = await lz.encrypt(_data, keys, { encoding: opts?.encoding ?? 'utf16' })
        lock.put(encrypted, (ak: any) => {
          if (ak.err) {
            throw new Error(ak.err)
          }
        })
      }
      if (data) {
        let obj, tmp
        tmp = data._
        delete data._
        obj = await lz.decrypt(data, keys, { encoding: opts?.encoding ?? 'utf16' })
        if (obj.vault && obj.vault_id !== cID) {
          //check POW hashes to make sure they match
          throw new Error(`Err authenticating ${vault}`)
        }
        cback && cback({ _: tmp, chainlocker: obj, gun: ack })
      }
    })
  })

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
        data = await lz.encrypt(data, keys, { encoding: opts?.encoding ?? 'utf16' })
        node.put(data, (ack) => {
          if (cb2) {
            cb2(ack)
          }
        })
      },
      async value(cb) {
        node.once(async (data) => {
          let obj, tmp
          if (!data) {
            return cb({ err: 'Record not found' })
          } else {
            tmp = data._
            delete data._
            obj = await lz.decrypt(data, keys, { encoding: opts?.encoding ?? 'utf16' })
            cb({ _: tmp, ...obj })
          }
        })
      },
    }
  }

  return gun //return gun user instance
}

Gun.chain.keys = async function (secret) {
  // can add secret string, username and password, or an array of secret strings\
  let keypair = MASTER_KEYS
  if (secret) {
    let sys = await SysUserPair(typeof secret === 'string' ? [secret] : [...secret])
    keypair = sys.keys
  }
  return keypair
}
