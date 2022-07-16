'use strict'
import { chalk, fetch, question } from 'zx'
import Help from '../../lib/help.mjs'
import { warn } from '../../lib/debug.mjs'
import { read } from '../../lib/file-utils.mjs'
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
      })
      break
    case 'put':
      let value2
      let data
      for (let i = 0; i < flags.length; i++) {
        if (flags[i] === '--stdin') {
          value2 = flags[i + 1]
          data = { stdin_data: value2, attributes: { run: false, env: 'shell', description: null } }
        }
        if (flags[i] === '--file') {
          value2 = flags[i + 1]
          data = await read(value2)
          data = JSON.stringify(data)
          data = { file_data: data, attributes: { run: false, env: 'html/js/css', description: null } }
        }
        if (flags[i] === '--url') {
          value2 = flags[i + 1]
          let protocol = 'https://',
            secure = true
          for (let j = 0; j < flags[i + 1].length; j++) {
            if (flags[j] === '--insecure') {
              secure = false
              protocol = 'http://'
            }
          }
          let url = value2.startsWith(protocol) ? value2 : `${protocol}://${flags[i + 1]}`
          data = await fetch(url)
          data = { url_data: data, attributes: { run: false, env: 'html/js/css', description: null } }
        }
      }
      gun.vault(nodepath).put(data, async (data2) => {
        if (data2.err) {
          warn(data2.err)
        } else {
          console.log(data2)
        }
      })
      break
    default:
      Help()
      break
  }
}
