import { $, ProcessOutput } from 'zx'
import Pair from './encryption/pair.mjs'
import os from 'os'
import config from '../../config/index.mjs'
import { ISEAPair } from 'gun/types/index.js'
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

//Master keys for 'Public' data. Config holds all environment variables that were declared in the shell on startup..
// More arbitrary data can be added to the config file for a more secure vault salt
export const MASTER_KEYS = (await Pair(config, Object.values(getImmutableMachineInfo()))) as ISEAPair
