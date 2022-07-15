import Gun, { IGunChain, IGunInstance } from 'gun'
import { chalk, $, fetch, glob, question } from 'zx'
import config from '../../../config/index.mjs'
import Help from '../../lib/help.mjs'
import { warn } from '../../lib/debug.mjs'
import checkIfValidJSON from '../../lib/checkIfValidJSON.mjs'
import { read, readDirectorySync, interpretPath } from '../../lib/file-utils.mjs'
import Run from '../runner.mjs'
// import '../../lib/chain-hooks/chainlocker.mjs'
// import 'gun/lib/path.js'
// import 'gun/lib/load.js'
// import 'gun/lib/open.js'
// import 'gun/lib/then.js'

export default async function (args: string[] = [], currentVault: string, gun: IGunChain<any> | IGunInstance<any>) {
  let [key, value, ...flags] = args
  let nodepath = value
  if (!nodepath) {
    nodepath = await question(chalk.white.bold(`Enter desired path to ${currentVault} \n  ❱`))
  }
  switch (key) {
    case 'get':
      //@ts-ignore
      gun.vault(nodepath).value(async (data) => {
        console.log(data)
        await Run(nodepath, currentVault)
      })
      break
    case 'put':
      let flag = flags.values().next().value
      value = flags.values().next().value
      if (!value) {
        value = await question(chalk.white.bold(`Enter value to store at path: ${nodepath} \n  ❱`))
      }
      let data
      if (flag === ('--file' || '-f')) {
        data = await read(value)
      }
      if (flag === ('--url' || '-U')) {
        data = JSON.stringify(await fetch(value))
      }
      if (flag === ('--stdin' || '-s')) {
        data = value
      }
      //@ts-ignore
      gun.vault(nodepath).put(data, async (data) => {
        if (data.err) {
          warn(data.err)
        } else {
          console.log(data)
        }
        await Run(nodepath, currentVault)
      })
      break
    default:
      Help()
      break
  }
}
