import Gun, { IGunChain, IGunInstance } from 'gun'
import { chalk, $, fetch, glob, question } from 'zx'
import config from '../../../config/index.mjs'
import Help from '../../lib/help.mjs'
import { warn } from '../../lib/debug.mjs'
import validJSON from '../../lib/checkIfValidJSON.mjs'
import { read, readDirectorySync, interpretPath } from '../../lib/file-utils.mjs'
import Run from '../runner.mjs'
import '../../lib/chain-hooks/chainlocker.mjs'
import 'gun/lib/path.js'
import 'gun/lib/load.js'
import 'gun/lib/open.js'
import 'gun/lib/then.js'

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
      let value
      if (!value) {
        value = await question(chalk.white.bold(`Enter value to store at path: ${nodepath} \n  ❱`))
      }
      let data
      for (let i = 0; i < flags.length; i++) {
        if (flags[i] === '--stdin') {
          value = flags[i + 1]
          data = { stdin_data: value, attributes: { run: false, env: 'shell', description: null } }
        }
        if (flags[i] === ('--file' || '-f')) {
          value = flags[i + 1]
          data = await read(value)
          data = validJSON(data) ? validJSON(data) : data
          data = { file_data: value, attributes: { run: false, env: 'html/js/css', description: null } }
        }
        if (flags[i] === ('--url' || '-U')) {
          let protocol = 'https://',
            secure = true
          for (let j = 0; j < flags[i + 1].length; j++) {
            if (flags[j] === '--insecure') {
              secure = false
              protocol = 'http://'
            }
          }
          let url = value.startsWith(protocol) ? value : `${protocol}://${flags[i + 1]}`
          data = await fetch(url)
          data = { url_data: data, attributes: { run: false, env: 'html/js/css', description: null } }
        }
      }
      //@ts-ignore
      gun.vault(nodepath).put(data, async (data) => {
        if (data.err) {
          warn(data.err)
          return await Run(nodepath, currentVault)
        } else {
          console.log(data)
          return await Run(nodepath, currentVault)
        }
      })
      break
    default:
      Help()
      break
  }
}
