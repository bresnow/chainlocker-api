import getArgs from './arg.mjs'
import Gun from 'gun'
import { $, glob, chalk, ProcessOutput } from 'zx'
import Pair from '../../lib/encryption/pair.mjs'
import os from 'os'
let sn: ProcessOutput
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
export async function auth(pw: string) {
  let username = os.userInfo().username,
    serial = sn.stdout.split(':')[1].trim(),
    platform = os.platform(),
    arch = os.arch()
  console.log(chalk.blue(JSON.stringify(await Pair(pw, Object.entries({ username, serial, platform, arch })), null, 2)))
  return await Pair(pw, Object.entries({ username, serial, platform, arch }))
}
await auth('123456')
