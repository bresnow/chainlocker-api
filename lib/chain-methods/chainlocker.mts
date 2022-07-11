import EventEmitter from 'events'
import Gun, { GunUser, IGun, IGunChain, IGunInstance, ISEAPair } from 'gun'
import SEA from 'gun/sea.js'
import Pair from '../encryption/pair.mjs'
import { lzObject } from 'lz-object'
import os from 'os'
export const checkIfThis = {
  isObject: (value: any) => {
    return !!(value && typeof value === 'object' && !Array.isArray(value))
  },
  isNumber: (value: any) => {
    return !!isNaN(Number(value))
  },
  isBoolean: (value: string | boolean) => {
    return value === 'true' || value === 'false' || value === true || value === false
  },
  isString: (value: any) => {
    return typeof value === 'string'
  },
  isArray: (value: any) => {
    return Array.isArray(value)
  },
}
type AuthSuccedAck = { ack: 2; soul: string; get: string; put: GunUser; sea: ISEAPair }
type AuthFailedAck = { err: string }
/**
 * Were gonna work some magic with this info. Probably wont use them all
 */
const sys = {
  platform: os.platform(),
  user: os.userInfo(),
  hostname: os.hostname(),
}
/**
 * sea.works all our system info for node keys
 * @returns {Promise<typeof sys>}
 */
async function sysWorked(encryptionkey: ISEAPair | null | undefined) {
  const entries = Object.entries(sys)
  let obj: Record<string, any> = {}
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

async function rsvEncryptCompress(object: any, encryptionkey: { epriv: string }) {
  if (!object) {
    console.error(`cannot encrypt and compress object as it is undefined`)
    // throw new Error(`cannot encrypt and compress object as it is undefined`);
  }
  if (object && checkIfThis.isObject(object)) {
    const entries = Object.entries(object)
    let obj: Record<string, any> = {}
    for (let i = 0; i < entries.length; i += 1) {
      const [objectKey, objectValue] = entries[i]

      if (encryptionkey && checkIfThis.isString(objectValue)) {
        try {
          let encrypted = await Gun.SEA.encrypt(objectValue, encryptionkey)
          obj[objectKey] = encrypted
        } catch (error) {
          throw new Error(error as string)
        }
      }
      if (checkIfThis.isObject(objectValue)) {
        await rsvEncryptCompress(objectValue, encryptionkey)
      }
    }
    return lzObject.compress(obj, { output: 'utf16' })
  }
}
async function rsvDecryptDcompress(object: any, encryptionkey: { epriv: string }) {
  if (!object) {
    console.error('cannot decrypt and decompress object as it is undefined')
    // throw new Error('cannot decrypt and decompress object as it is undefined');
  }
  if (checkIfThis.isObject(object)) {
    const entries = Object.entries(lzObject.decompress(object, { output: 'utf16' }))
    let obj: Record<string, any> = {}
    for (let i = 0; i < entries.length; i += 1) {
      const [objectKey, objectValue] = entries[i]

      if (encryptionkey && checkIfThis.isString(objectValue)) {
        let encrypted = await Gun.SEA.encrypt(objectValue, encryptionkey)
        obj[objectKey] = encrypted
      }
      if (checkIfThis.isObject(objectValue)) {
        await rsvDecryptDcompress(objectValue, encryptionkey)
      }
    }
    return obj
  }
}

const chain = Gun.chain as IGun['chain']

;(chain as any).locker = function (this: IGunInstance<any>) {
  const gun = this

  const events = new EventEmitter()
  events.on('error', function (err) {
    console.error(err)
  })

  let pair: ISEAPair
  ;(gun as any).locker = {
    name: async (key: any, name: any) => {
      pair = await Pair(key, name)
      return gun.user().auth(pair, (ack: AuthSuccedAck | AuthFailedAck) => {
        let err = (ack as AuthFailedAck).err
        if (err) {
          events.emit('error', err)
        }
      })
      // .get()
      // .get(sys.user)
    },
    put: async (name: any, data: any) => {
      if (checkIfThis.isObject(data)) {
        data = await rsvEncryptCompress(data, pair)
      }
      gun.user().get('locker').get('items').get(name).put(data)
    },
    get: async (name: any, run: any, global: boolean, cb: (arg0: string) => void | PromiseLike<void>) => {
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
    list: async (del: any, cb: (arg0: string) => void) => {
      let last: any[] = []
      last.length = 0
      gun
        .user()
        .get('gunsafe')
        .get('list')
        .map()
        .once((data) => {
          if (last.includes(data)) return
          gun
            .user()
            .get('gunsafe')
            .get('items')
            .get(data)
            .once((d) => {
              if (d === null && del) {
                cb('[ deleted ] ' + data)
              } else if (d !== null && !del) {
                cb(data)
              }
            })
          last.push(data)
        })
    },
    delete: async (name: any) => {
      if (!name) {
        gun.user().get('gunsafe').put(null)
        gun
          .user()
          .get('gunsafe')
          .get('list')
          .map()
          .once((data) => {
            gun.user().get('gunsafe').get('items').get(data).put(null)
            gun.user().get('gunsafe').get('list').put(null)
          })
      } else {
        gun.user().get('gunsafe').get('items').get(name).put(null)
      }
    },
    peers: (peers: boolean) => {
      if (peers && typeof peers === 'object') gun.opt({ peers: peers })
      if (peers === false) {
        ;(gun as any).back('opt.peers')(gun._.opt as any).peers = {}
      }
      if (!peers) return (gun._.opt as any).peers
    },
    key: () => {
      return pair
    },
    pair: async (epriv: { epriv: string }) => {
      if (!epriv) {
        let keys = await SEA.pair()
        let encryptedKeys = await SEA.encrypt(pair, keys.epriv)
        gun.get('gunsafe').get('pair').put(encryptedKeys)
        return keys.epriv
      } else {
        gun
          .get('gunsafe')
          .get('pair')
          .once(async (data) => {
            gun.user().leave()
            data = await SEA.decrypt(data, epriv)
            gun.user().auth(data, (ack) => {})
            gun.on('auth', (ack) => {
              pair = (ack as any).sea
            })
          })
      }
    },
  }
  return gun
}
