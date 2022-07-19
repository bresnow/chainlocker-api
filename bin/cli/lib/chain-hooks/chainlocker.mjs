'use strict'
import Gun from 'gun'
import { SysUserPair, MASTER_KEYS } from '../auth.mjs'
import lz from '../lz-encrypt.mjs'
import lzString from 'lz-string'
import { err } from '../debug.mjs'
import 'gun/lib/path.js'
import 'gun/lib/load.js'
import 'gun/lib/open.js'
import 'gun/lib/then.js'
const SEA = Gun.SEA
export const getCID = async (vaultname, keypair) => lzString.compressToEncodedURIComponent(await Gun.SEA.work(vaultname, keypair))
Gun.chain.vault = function (vault, cb, opts) {
  let _gun = this
  let gun = _gun.user()
  let keys = opts?.keys || MASTER_KEYS
  gun.auth(keys, (ack) => {
    if (!ack.err) {
      let vnode = gun.get(`CHAINLOCKER`).get(vault)
      vnode.once(async (data) => {
        let cID = await getCID(vault, keys)
        let now = Date.now()
        if (!data) {
          vnode.put({ created: now, auth: cID })
        }
        vnode.once((data2) => {
          if (data2) {
            if (data2.auth !== cID) {
              cb && cb({ err: `Vault ${vault} is not authorized` })
            } else {
              vnode.put({ last_auth: now })
              cb && cb(data2)
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
      temp = gun
    if (typeof nodepath === 'string') {
      path = nodepath.split('/')
      if (path.length === 1) {
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
      async value(cb2) {
        node.load(async (data) => {
          let obj
          if (!data) {
            return cb2({ err: 'Record not found' })
          } else {
            obj = await lz.decrypt(data, keys, { encoding: opts?.encoding ?? 'utf16' })
            cb2(obj)
          }
        })
      },
      async keys(secret) {
        let { keys: keys2 } = await SysUserPair(typeof secret === 'string' ? [vault, secret] : [vault, ...secret])
        return keys2
      },
    }
  }
  return gun
}
Gun.chain.keys = async function (secret) {
  let { keys } = await SysUserPair(typeof secret === 'string' ? [secret] : secret)
  return keys
}
