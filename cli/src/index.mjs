'use strict'
import { $ } from 'zx'
import os from 'os'
console.log()
var cmd
switch (os.platform()) {
  case 'win32':
    cmd = 'wmic csproduct get'
    break
  case 'darwin':
    await $`system_profiler SPHardwareDataType | grep "Serial"`
    break
  case 'linux':
    if (process.arch === 'arm') {
      await $`cat /proc/cpuinfo | grep UUID`
    } else {
      await $`dmidecode -t system  | grep UUID`
    }
    break
  case 'freebsd':
    cmd = 'dmidecode -t system'
    break
}
