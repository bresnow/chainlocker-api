'use strict'
import EventEmitter from 'events'
import Gun from 'gun'
import SEA from 'gun/sea.js'
import Pair from '../encryption/pair.mjs'
import os from 'os'
export const checkIfThis = {
  isObject: (value) => {
    return !!(value && typeof value === 'object' && !Array.isArray(value))
  },
  isNumber: (value) => {
    return !!isNaN(Number(value))
  },
  isBoolean: (value) => {
    return value === 'true' || value === 'false' || value === true || value === false
  },
  isString: (value) => {
    return typeof value === 'string'
  },
  isArray: (value) => {
    return Array.isArray(value)
  },
}
const sys = {
  platform: os.platform(),
  user: os.userInfo(),
  hostname: os.hostname(),
}
async function sysWorked(encryptionkey) {
  const entries = Object.entries(sys)
  let obj = {}
  for (let i = 0; i < entries.length; i += 1) {
    const [objectKey, objectValue] = entries[i]
    if (encryptionkey && checkIfThis.isString(objectValue)) {
      let encrypted = await Gun.SEA.work(objectValue, encryptionkey)
      obj[objectKey] = encrypted
    }
    if (checkIfThis.isObject(objectValue)) {
      await sysWorked(encryptionkey)
    }
  }
  return obj
}
const chain = Gun.chain
chain.locker = function () {
  const gun = this
  const events = new EventEmitter()
  events.on('error', function (err) {
    console.error(err)
  })
  let pair
  gun.locker = {
    name: async (key, name2) => {
      pair = await Pair(key, name2)
      return gun.user().auth(pair, (ack) => {
        let err = ack.err
        if (err) {
          events.emit('error', err)
        }
      })
    },
    put: async (name2, data2) => {
      if (checkIfThis.isObject(data2)) {
        data2 = await rsvEncryptCompress(data2, pair)
      }
      gun.user().get('locker').get('items').get(name2).put(data2)
    },
    get: async (name, run, global, cb) => {
      gun
        .user()
        .get('locker')
        .get('items')
        .get(name)
        .once(async (data) => {
          if (!data) return cb('Record not found')
          data = await SEA.decrypt(data, pair)
          try {
            data = data.join(' ')
            if (!run) cb(data)
          } catch {}
          try {
            data = JSON.parse(data)
          } catch {}
          if (checkIfThis.isObject(data)) {
            data = await rsvDecryptDcompress(data, pair)
          }
          if (run) {
            try {
              if (global === false) {
                console.log('Running Function')
                let fn = new Function(data)
                fn()
              } else eval(data)
            } catch {
              cb(data)
            }
          } else {
            cb(data)
          }
          gun.user().get('locker').get('items').get(name).off()
        })
    },
    list: async (del, cb2) => {
      let last = []
      last.length = 0
      gun
        .user()
        .get('gunsafe')
        .get('list')
        .map()
        .once((data2) => {
          if (last.includes(data2)) return
          gun
            .user()
            .get('gunsafe')
            .get('items')
            .get(data2)
            .once((d) => {
              if (d === null && del) {
                cb2('[ deleted ] ' + data2)
              } else if (d !== null && !del) {
                cb2(data2)
              }
            })
          last.push(data2)
        })
    },
    delete: async (name2) => {
      if (!name2) {
        gun.user().get('gunsafe').put(null)
        gun
          .user()
          .get('gunsafe')
          .get('list')
          .map()
          .once((data2) => {
            gun.user().get('gunsafe').get('items').get(data2).put(null)
            gun.user().get('gunsafe').get('list').put(null)
          })
      } else {
        gun.user().get('gunsafe').get('items').get(name2).put(null)
      }
    },
    peers: (peers) => {
      if (peers && typeof peers === 'object') gun.opt({ peers })
      if (peers === false) {
        gun.back('opt.peers')(gun._.opt).peers = {}
      }
      if (!peers) return gun._.opt.peers
    },
    key: () => {
      return pair
    },
    pair: async (epriv) => {
      if (!epriv) {
        let keys = await SEA.pair()
        let encryptedKeys = await SEA.encrypt(pair, keys.epriv)
        gun.get('gunsafe').get('pair').put(encryptedKeys)
        return keys.epriv
      } else {
        gun
          .get('gunsafe')
          .get('pair')
          .once(async (data2) => {
            gun.user().leave()
            data2 = await SEA.decrypt(data2, epriv)
            gun.user().auth(data2, (ack) => {})
            gun.on('auth', (ack) => {
              pair = ack.sea
            })
          })
      }
    },
  }
  return gun
}
