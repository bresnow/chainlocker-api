'use strict'
import Gun from 'gun'
import { auth, getImmutableMachineInfo } from '../auth.mjs'
const SEA = Gun.SEA
export async function machineID_WorkSalt(lockername, keys, vaultDirectory) {
  let workedName = await SEA.work(lockername, keys, null, { name: 'SHA-256', length: 12 })
  let compath = lzStr.compressToEncodedURIComponent(workedName)
  let $LOCKER_PATH = `${process.cwd()}/.${vaultDirectory ?? 'chainlocker'}`
  let mechID = getImmutableMachineInfo()
  return { workedName, compath, $LOCKER_PATH, mechID }
}
export default Gun.chain.locker = async function (lockerName, vaultDirectory) {
  var _gun = this
  let user = _gun.user()
  let keys = await auth(lockerName)
  let { workedName, $LOCKER_PATH, mechID } = await machineID_WorkSalt(lockerName, keys, vaultDirectory)
  _gun.on('auth', (ack) => {
    if (!ack.err && !exists(`${$LOCKER_PATH}/${lockerName}`)) {
      user.get('init/locker').put({ info: mechID, workedName, name: lockerName })
    }
  })
  user.auth(keys)
  _gun.locker = {
    path: async (path, cb) => {
      user.path(path).load(async (data) => {
        if (!data) return cb({ err: 'Record not found' })
        try {
          delete data._
          data = await lz.decrypt(data, keys)
          cb(data)
        } catch (error) {
          err(error)
        }
      })
    },
    put: async (path, data, cb) => {
      if (checkIfThis.isObject(data)) {
        data = await lz.encrypt(data, keys)
      } else {
        data = await lz.encrypt({ data }, keys)
      }
      user.path(path).put(data, cb)
    },
  }
  return _gun
}
