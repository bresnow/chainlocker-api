import { $, ProcessOutput } from 'zx'
import Pair from './encryption/pair.mjs'
import os from 'os'
let sn: ProcessOutput
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
      sn = await $`cat /proc/cpuinfo | grep UUID`
    } else {
      sn = await $`dmidecode -t system  | grep UUID`
    }
    break
  case 'freebsd':
    sn = await $`dmidecode -t system`
    break
}
export async function auth(secret: string) {
  let { username, serial, platform, arch } = getImmutableMachineInfo()
  return await Pair(secret, Object.entries({ username, serial, platform, arch }))
}

export function getImmutableMachineInfo() {
  let username = os.userInfo().username,
    serial = sn.stdout.split(':')[1].trim(),
    platform = os.platform(),
    arch = os.arch()
  return { username, serial, platform, arch }
}
