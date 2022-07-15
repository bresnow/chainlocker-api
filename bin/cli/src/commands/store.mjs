'use strict'
import { chalk, question } from 'zx'
import Help from '../../lib/help.mjs'
import { warn } from '../../lib/debug.mjs'
import { read } from '../../lib/file-utils.mjs'
import Run from '../runner.mjs'
import '../../lib/chain-hooks/chainlocker.mjs'
import 'gun/lib/path.js'
import 'gun/lib/load.js'
import 'gun/lib/open.js'
import 'gun/lib/then.js'
export default async function (args = [], currentVault, gun) {
  let [key, value, ...flags] = args
  let nodepath = value
  if (!nodepath) {
    nodepath = await question(
      chalk.white.bold(`Enter desired path to ${currentVault} 
  \u2771`)
    )
  }
  switch (key) {
    case 'get':
      gun.vault(nodepath).value(async (data2) => {
        console.log(data2)
        await Run(nodepath, currentVault)
      })
      break
    case 'put':
      let [flag, value2, ...continued] = flags
      console.log(flags, 'flags')
      if (!value2) {
        value2 = await question(
          chalk.white.bold(`Enter value to store at path: ${nodepath} 
  \u2771`)
        )
      }
      let data
      for (let i = 0; i < flags.length; i++) {
        if (flags[i] === '--stdin') {
          value2 = flags[i + 1]
          data = { stdin_data: value2, attributes: { run: false, env: 'shell', description: null } }
        }
        if (flags[i] === '--file') {
          data = await read(flags[i])
          value2 = flags[i + 1]
          data = { file_data: value2, attributes: { run: false, env: 'html/js/css', description: null } }
        }
      }
      gun.vault(nodepath).put(data, async (data2) => {
        if (data2.err) {
          warn(data2.err)
          return await Run(nodepath, currentVault)
        } else {
          console.log(data2)
          return await Run(nodepath, currentVault)
        }
      })
      break
    default:
      Help()
      break
  }
}
