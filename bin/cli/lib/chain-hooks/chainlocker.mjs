'use strict'
import Gun from 'gun'
import { SysUserPair, MASTER_KEYS } from '../auth.mjs'
import lz from '../lz-encrypt.mjs'
import 'gun/lib/path.js'
import 'gun/lib/load.js'
import 'gun/lib/open.js'
import 'gun/lib/then.js'
const SEA = Gun.SEA
Gun.chain.vault = function (vault, opts) {
  let _gun = this
  let gun = _gun.user()
  let keys = opts?.keys || MASTER_KEYS
  gun.auth(keys, (ack) => {
    if (!ack.err) {
      let vnode = gun.get(`CHAINLOCKER`)
      vnode.once(async (data) => {
        let cID = await Gun.SEA.work(vault, keys)
        let now = new Date(Date.now()).toLocaleDateString()
        if (!data) {
          vnode.get(cID).put({ vault, created: now })
        }
        vnode.get(cID).get('last_auth').put({ last_auth: now })
      })
    } else {
      console.error(ack.err)
    }
  })
  _gun.keys = async function (secret) {
    let { keys: keys2 } = await SysUserPair(typeof secret === 'string' ? [secret] : secret)
    return keys2
  }
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
        data = await lz.encrypt(data, keys)
        node.put(data, cb2)
      },
      async value(cb) {
        node.load(async (data) => {
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
  return gun
}
