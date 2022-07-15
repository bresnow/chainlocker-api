import Gun, { IGunInstance, ISEAPair } from 'gun'
import { $, chalk, question } from 'zx'
import { exists } from 'fsxx'
import { auth, getImmutableMachineInfo } from '../lib/auth.mjs'
import { err, warn } from '../lib/debug.mjs'
import Vault from './commands/vault.mjs'
import Help from '../lib/help.mjs'
// import '../lib/chain-hooks/chainlocker.mjs'
import Push from '../lib/dev/push.mjs'
import Build from '../lib/dev/build.mjs'
import lzStr from 'lz-string'
// import 'gun/lib/path.js'
// import 'gun/lib/load.js'
// import 'gun/lib/open.js'
// import 'gun/lib/then.js'
import Store from './commands/store.mjs'
import config from '../../config/index.mjs'
import Pair from '../lib/encryption/pair.mjs'
const SEA = Gun.SEA

/**
 * The  directory that stores all the vaults and their data. Vault names are hashed with POW algorithm then compressed to URI safe utf16 characters.
 * @param lockername the name of the locker
 * @param keys  - The keys to use for encryption
 * @param vaultDirectory  the directory to store the locker in if a custom directory is chosen
 * @returns workedName the name of the locker directory
 * returns $LOCKER_PATH the path to the locker directory
 */
let machine = getImmutableMachineInfo()
//Master keys for 'Public' data. Config is
let MASTER_KEYS = (await Pair(config, Object.values(machine))) as ISEAPair
export const getLockerName = async (compressed: string) => {
  let decompressed = lzStr.decompressFromUTF16(compressed)
  if (decompressed) {
    return await Gun.SEA.decrypt(decompressed, MASTER_KEYS)
  } else {
    err('Failed to decrypt locker name. Check your master keys.')
  }
}

export function validateKeys(keys: ISEAPair = MASTER_KEYS) {
  return new Promise((resolve, reject) => {
    Gun()
      .user()
      .auth(keys, (ack) => {
        let { err, get, sea } = ack as any
        if (err) {
          reject(err)
        } else {
          resolve({ sea })
        }
      })
  })
}
await Run()
export default async function Run(path = 'root-node', vault: string = config.DefaultVault) {
  let keys = await auth(vault)
  let worked = (await SEA.work(vault, MASTER_KEYS)) as string
  let secureVault = lzStr.compressToUTF16(worked)
  let $LOCKER_PATH = config.LockerDirectory + '/' + secureVault
  let gun: IGunInstance<any>

  try {
    if (!exists($LOCKER_PATH)) {
      console.log(chalk.white.italic(`New vault setup.`))
      await $`mkdir -p ${$LOCKER_PATH}`
    }
    gun = new Gun({ file: `${$LOCKER_PATH}` })
    //@ts-ignore
    gun.locker(vault)
  } catch (error) {
    err(error as string)
  }

  let cmd = await question(chalk.white(`Current Node ❱ ${chalk.red.bold('>>')}${path ?? 'root'}${chalk.red.bold('-->>')}  `))
  if (cmd) {
    cmd = cmd.trim()
    if (cmd) {
      let runner = cmd.split(' ').map((x) => x.trim().toLocaleLowerCase())
      let [command, opt, ...args] = runner
      // console.log(command, opt, args, '\n', runner)

      const chainlockerOpts = new Map([
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
      if (command === ('chain' || 'locker' || 'chainlocker')) {
        if (chainlockerOpts.has(opt)) {
          let run = chainlockerOpts.get(opt)
          if (run) {
            await run(args)
          }
        } else {
          err(`${opt} is not a valid command.`)
          Help('chainlocker')
        }
      }
      if (command === ('exit' || 'quit')) {
        let confirm = await question(chalk.white(`Are you sure you want to exit? (y/N)`))
        if (confirm === 'y' && opt !== '--force') {
          console.log(chalk.white.italic(`Pushing to github before exit...`))
          await Push()
          process.exit(0)
        }
        if (confirm === 'y' && opt === '--force') {
          process.exit(0)
        }
        warn('Aborting exit.')
        await Run()
      }
    }
  }
}
