import Gun from 'gun'
import { auth, getImmutableMachineInfo } from '../auth.mjs'
import lz from '../lz-encrypt.mjs'
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
export default Gun.chain.locker = async function (lockerName, vaultDirectory) {
  var _gun = this
  let user = _gun.user()
  let keys = await auth(lockerName)
  user.auth(keys)
  _gun.vault = (path) => {
    let node = user
    path = Array.isArray(path) ? path : `${path}`.split('/' || '.' || '-')
    for (let i = 0; i < path.length; i++) {
      node = node.get(path[i])
    }
    return {
      async put(data, cb2) {
        if (typeof data === 'object') {
          data = await lz.encrypt(data, keys)
        }
        if (typeof data === 'string') {
          data = await lz.encrypt(data, keys)
        }
        node.put(data, cb2)
      },
      async value(cb) {
        node.once(async (data) => {
          if (!data) return cb('Record not found')
          try {
            let state = data._['>'],
              dateObj
            for (let val in state) {
              dateObj[val] = new Date(state[val]).toLocaleString('en-US', { timeZone: 'America/New_York' }).slice(0, -3)
            }
            // console.log(data)
            delete data._
            data = await lz.decrypt(data, keys)
            data = { ...data, timestamp: dateObj }
            cb(data)
          } catch (error) {
            console.error(error)
          }
        })
      },
    }
  }
  return _gun
}
