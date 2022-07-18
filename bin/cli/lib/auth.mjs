'use strict'
import { $ } from 'zx'
import Pair from './encryption/pair.mjs'
import os from 'os'
import Gun from 'gun'
let sn
$.verbose = false
switch (os.platform()) {
  case 'win32':
    sn = await $`wmic csproduct get`
    break
  case 'darwin':
    sn = await $`system_profiler SPHardwareDataType | grep "Serial"`
    break
  case 'linux':
    if (os.arch() === 'arm') {
      sn = await $`sudo cat /proc/cpuinfo | grep UUID`
    } else {
      sn = await $`sudo dmidecode -t system  | grep UUID`
    }
    break
  case 'freebsd':
    sn = await $`dmidecode -t system`
    break
}
export async function SysUserPair(secret) {
  let { username, serial, platform, arch } = getImmutableMachineInfo()
  let salt = secret ? Object.values({ username, platform, arch }).concat(...secret) : Object.values({ username, platform, arch })
  let keys = await Pair(serial, salt)
  let hashedSerial = await Gun.SEA.work(serial, keys, null, { name: 'SHA-256', salt })
  return { keys, username, serial: hashedSerial }
}
export const { keys: MASTER_KEYS, serial: MASTER_SERIAL } = await SysUserPair()
export function getImmutableMachineInfo() {
  let username = os.userInfo().username,
    serial = sn.stdout.split(':')[1].trim(),
    platform = os.platform(),
    arch = os.arch()
  return { username, serial, platform, arch }
}
