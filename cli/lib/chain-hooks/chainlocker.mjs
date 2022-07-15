import Gun from 'gun'
import { auth, getImmutableMachineInfo } from '../auth.mjs'
import lz from '../lz-encrypt.mjs'
import lzString from 'lz-string'
import { lzObject } from 'lz-object'
import { exists, read } from '../file-utils.mjs'
import 'gun/lib/path.js'
import 'gun/lib/load.js'
import 'gun/lib/open.js'
import 'gun/lib/then.js'
const SEA = Gun.SEA
export async function machineID_WorkSalt(lockername, keys, vaultDirectory) {
  let workedName = await SEA.work(lockername, keys, null, { name: 'SHA-256', length: 12 })
  let $LOCKER_PATH = `${process.cwd()}/.${vaultDirectory ?? 'chainlocker'}`
  let mechID = getImmutableMachineInfo()

  return { workedName, compath, $LOCKER_PATH, mechID }
}
Gun.chain.locker = async function (lockerName) {
  var _gun = this
  let user = _gun.user()
  let keys = await auth(lockerName)
  user.auth(keys)
  _gun.vault = (path) => {
    let node = user.path(path)
    return {
      async put(data, cb2) {
        console.log('put', data)
        data = await lz.encrypt(data, keys)
        node.put(data, cb2)
        node.once((data) => console.log('TEST', data))
      },
      async value(cb) {
        node.once(async (data) => {
          let obj
          if (!data) return cb('Record not found')
          try {
            let state = data._['>'],
              dateObj
            for (let val in state) {
              dateObj[val] = new Date(state[val]).toLocaleString('en-US', { timeZone: 'America/New_York' }).slice(0, -3)
            }
            console.log(data)
            delete data._
            data = await lz.decrypt(data, keys)
            obj = Object.assign(data, dateObj)
            console.log(obj, 'decrypted')
            cb(data)
          } catch (error) {
            warn(error)
          }
        })
      },
      async uint8Press(data) {
        if (typeof data === 'object') {
          data = await lz.encrypt(data, keys)
        }
        if (typeof data === 'string') {
          data = await SEA.encrypt(data, keys)
          data = lzObject.compress({ data }, { output: 'uint8array' })
        }
        node.put(data, cb2)
        node.once((data) => console.log('TEST', data))
      },
    }
  }
  return _gun
}
