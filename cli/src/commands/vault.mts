import Run, { getLockerName } from '../runner.mjs'
import { chalk, $, fetch, glob, question } from 'zx'
import Help from '../../lib/help.mjs'
import config from '../../../config/index.mjs'
import { readDirectorySync } from '../../lib/file-utils.mjs'
import { remove } from '../../lib/file-utils.mjs'
import { warn } from '../../lib/debug.mjs'
import { IGunChain, IGunInstance } from 'gun'
export default async function (args: string[] = [], currentVault: string, gun: IGunChain<any> | IGunInstance<any>) {
  let [key, value, ...flags] = args
  //   console.log([key, value, ...flags], 'key value flags')
  switch (key) {
    case 'create':
      let newVault = value
      if (!newVault) {
        newVault = await question(chalk.white.bold('Enter desired vault name or choose a new name to create a new vault\n  ❱'))
      }
      newVault = newVault.trim()
      console.log(chalk.italic.white(`Checking out from ${currentVault} to ${newVault}\n ❱ `))
      await Run(config.defaultRootNode, newVault)
      break
    case 'list':
      let vdir = readDirectorySync(config.LockerDirectory)
      console.log(vdir)
      vdir.forEach(async (v) => {
        if (!v) {
          warn("No vaults found. Try the 'chainlocker create' command to create a new vault.")
        }
        let [parent, goods] = v.split(config.LockerDirectory)
        console.log(chalk.italic.blueBright(goods))
        console.log(chalk.italic.blueBright(`${await getLockerName(goods)}`))
      })
      await Run(config.defaultRootNode, currentVault)
      break
    case 'delete':
      //@ts-ignore
      var peers = gun.back('opt.peers')
      console.log('PEERS', peers)
      //@ts-ignore
      var mesh = gun.back('opt.mesh')
      Object.values(peers).forEach(async (peer) => {
        console.log(chalk.italic.white(`${peer}`))
      })

      console.log(`\n`)
      console.log(
        chalk.bold.white(
          `${currentVault} is connected to the peers listed above. You will be able to delete this vault locally but the encrypted data will remain on the network.`
        )
      )
      let confirm = await question(
        chalk.yellowBright.bold(`Please Input ${chalk.green.bold(currentVault.toUpperCase())} To Veryify This Choice.\n`)
      )
      if (confirm.trim() === currentVault.toUpperCase()) {
        console.log(chalk.italic.white(`Deleting ${currentVault}`))
        await remove(config.LockerDirectory + currentVault)
        await Run(config.defaultRootNode, config.DefaultVault)
      } else {
        warn('Aborting vault deletion.')
        await Run(config.defaultRootNode, currentVault)
      }

      break
    default:
      Help()
      await Run(config.defaultRootNode, currentVault)
      break
  }
}
