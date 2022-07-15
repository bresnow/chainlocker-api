'use strict'
import { chalk, fetch, question } from 'zx'
import Help from '../../lib/help.mjs'
import { warn } from '../../lib/debug.mjs'
import { read } from '../../lib/file-utils.mjs'
import Run from '../runner.mjs'
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
      let flag = flags.values().next().value
      value = flags.values().next().value
      if (!value) {
        value = await question(
          chalk.white.bold(`Enter value to store at path: ${nodepath} 
  \u2771`)
        )
      }
      let data
      if (flag === '--file') {
        data = await read(value)
      }
      if (flag === '--url') {
        data = JSON.stringify(await fetch(value))
      }
      if (flag === '--stdin') {
        data = value
      }
      gun.vault(nodepath).put(data, async (data2) => {
        if (data2.err) {
          warn(data2.err)
        } else {
          console.log(data2)
        }
        await Run(nodepath, currentVault)
      })
      break
    default:
      Help()
      break
  }
}
