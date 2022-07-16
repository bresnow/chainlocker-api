'use strict'
import { chalk, question } from 'zx'
import Help from '../../lib/help.mjs'
import config from '../../../config/index.mjs'
import { readDirectorySync } from '../../lib/file-utils.mjs'
import { remove } from '../../lib/file-utils.mjs'
import { warn } from '../../lib/debug.mjs'
export default async function (args = [], currentVault, gun) {
  let [key, value, ...flags] = args
  switch (key) {
    case 'create':
      let newVault = value
      newVault = newVault.trim()
      console.log(
        chalk.italic.white(`Checking out from ${currentVault} to ${newVault}
 \u2771 `)
      )
      break
    case 'list':
      let vdir = readDirectorySync(config.lockerDirectory)
      console.log(vdir)
      vdir.forEach(async (v) => {
        if (!v) {
          warn("No vaults found. Try the 'chainlocker create' command to create a new vault.")
        }
        let [parent, goods] = v.split(config.lockerDirectory)
        console.log(chalk.italic.blueBright(goods))
      })
      break
    case 'delete':
      var peers = gun.back('opt.peers')
      console.log('PEERS', peers)
      var mesh = gun.back('opt.mesh')
      Object.values(peers).forEach(async (peer) => {
        console.log(chalk.italic.white(`${peer}`))
      })
      console.log(`
`)
      console.log(
        chalk.bold.white(
          `${currentVault} is connected to the peers listed above. You will be able to delete this vault locally but the encrypted data will remain on the network.`
        )
      )
      let confirm = await question(
        chalk.yellowBright.bold(`Please Input ${chalk.green.bold(currentVault.toUpperCase())} To Veryify This Choice.
`)
      )
      if (confirm.trim() === currentVault.toUpperCase()) {
        console.log(chalk.italic.white(`Deleting ${currentVault}`))
        await remove(config.lockerDirectory + currentVault)
      } else {
        warn('Aborting vault deletion.')
      }
      break
    default:
      Help()
      break
  }
}
