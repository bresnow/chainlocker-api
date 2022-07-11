import Gun from 'gun'
import { $, glob, chalk, question } from 'zx'
// import { auth } from '../../cli/src/utils/auth.mjs'
// import{ err, info } from '../../cli/src/utils/log.mjs'
import lz from '../utils/lz-encrypt.mjs'
import Pair from '../utils/pair.mjs'

import os from 'os'
const SEA = Gun.SEA
let err = console.err
let sn
switch (os.platform()) {
  case 'win32':
    sn = await $`wmic csproduct get`
    break
  case 'darwin':
    sn = await $`system_profiler SPHardwareDataType | grep "Serial"`
    break
  case 'linux':
    if (os.arch() === 'arm') {
      sn = await $`cat /proc/cpuinfo | grep UUID`
    } else {
      sn = await $`dmidecode -t system  | grep UUID`
    }
    break
  case 'freebsd':
    sn = await $`dmidecode -t system`
    break
}
export async function auth(pw) {
  let username = os.userInfo().username,
    serial = sn.stdout.split(':')[1].trim(),
    platform = os.platform(),
    arch = os.arch()
  return await Pair(pw, Object.entries({ username, serial, platform, arch }))
}

export default async function CreateLocker() {
  Gun.chain.createLocker = async function (lockerName) {
    var _gun = this

    let keys = await auth(lockerName)
    let workedName = await SEA.work(lockerName, keys)
    let user = _gun.user()
    try {
      let lockerdata = {
        name: lockerName,
      }
      lockerdata = await lz.encrypt(lockerdata, keys)
      user.auth(keys, (ack) => {
        if (!ack.err) {
          user.get('lockers').get(workedName).put(lockerdata)
        }
      })
    } catch (error) {
      err(error)
    }
    user
      .get('lockers')
      .get(workedName)
      .once((data) => console.log(data))
    return _gun
  }
  let lockername = await question('Enter the name of the locker')
  if (lockername) {
    lockername = lockername.trim()
  }
  let gun = new Gun()
  gun.createLocker(lockername)
}

await CreateLocker()
