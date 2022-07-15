import { IGunChain, IGunInstance } from 'gun'
import { chalk, $, fetch, glob, question } from 'zx'
import config from '../../../config/index.mjs'
import Help from '../../lib/help.mjs'
import { warn } from '../../lib/debug.mjs'
import { readDirectorySync } from '../../lib/file-utils.mjs'
import Run from '../runner.mjs'
import '../../lib/chain-hooks/chainlocker.mjs'
import 'gun/lib/path.js'
import 'gun/lib/load.js'
import 'gun/lib/open.js'
import 'gun/lib/then.js'
export default async function (args: string[] = [], currentVault: string, gun: IGunChain<any> | IGunInstance<any>) {
  let [key, value, ...flags] = args
  switch (key) {
    case 'get':
      let nodepath = value
      if (!nodepath) {
        nodepath = await question(chalk.white.bold(`Enter desired path to ${currentVault} \n  ❱`))
      }

      nodepath = nodepath.trim()
      await Run(config.defaultRootNode, nodepath)
      break
    case 'list':
      let vdir = readDirectorySync(config.LockerDirectory)
      console.log(vdir)
      vdir.forEach((v) => {
        if (!v) {
          warn("No vaults found. Try the 'chainlocker create' command to create a new vault.")
        }
        let [parent, goods] = v.split(config.LockerDirectory)
        console.log(chalk.italic.blueBright(goods))
      })
      await Run(config.defaultRootNode, config.DefaultVault)
      break
    default:
      Help()
      await Run(config.defaultRootNode, currentVault)
      break
  }
}
