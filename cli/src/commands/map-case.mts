import Help from '../../lib/help.mjs'
// import '../lib/chain-hooks/chainlocker.mjs'
import Push from '../../lib/dev/push.mjs'
import Build from '../../lib/dev/build.mjs'
import Vault from './vault.mjs'
import Store from './store.mjs'
import { IGunInstance } from 'gun'
import { err } from '../../lib/debug.mjs'
export default (vault: string, gun: IGunInstance) =>
  new Map([
    [
      'help',
      async function (_args: string[] = []) {
        //TODO: finish help
        Help('chainlocker')
      },
    ],
    [
      'vault',
      async function (args: string[] = []) {
        await Vault(args, vault, gun)
      },
    ],
    [
      'store',
      async function (args: string[] = []) {
        await Store(args, vault, gun)
      },
    ],
    // DEVELOPER COMMANDS
    [
      'dev',
      async function (args: string[] = []) {
        let [key, value, ...flags] = args
        if (key === 'push') {
          console.log(chalk.white.italic(`Pushing to github...`))
          try {
            await Build()
            await Push()
          } catch (error) {
            err(error as string)
          }
        }
        if (key === 'build') {
          console.log(chalk.white.italic(`Building...`))
          await Build()
        }
      },
    ],
  ])
