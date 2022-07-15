import Gun, { IGunInstance, ISEAPair } from 'gun'
import { $, fetch, glob, chalk, question } from 'zx'
import { checkIfThis } from '../lib/check.mjs'
import { exists, read, write } from 'fsxx'
import { auth, getImmutableMachineInfo } from '../lib/auth.mjs'
import { err, info, warn } from '../lib/debug.mjs'
import { interpretPath, mkdir, readDirectorySync } from '../lib/file-utils.mjs'
import Vault from './commands/vault.mjs'
import Help from '../lib/help.mjs'
import '../lib/chain-hooks/chainlocker.mjs'
import Push from '../lib/dev/push.mjs'
import Build from '../lib/dev/build.mjs'
import lzStr from 'lz-string'
import getArgs from '../lib/arg.mjs'
import 'gun/lib/path.js'
import 'gun/lib/load.js'
import 'gun/lib/open.js'
import 'gun/lib/then.js'
import Store from './commands/store.mjs'
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

let config: {
  LockerDirectory: string
  DefaultVault: string
  defaultRootNode: string
  directoryPrefix: string
} = {
  LockerDirectory: process.env.LOCKER_DIRECTORY || '.chainlocker',
  DefaultVault: process.env.LOCKER_NAME || 'default',
  defaultRootNode: process.env.DEFAULT_ROOT_NODE ?? 'root',
  directoryPrefix: 'MoUQgg3gRAxgLlAXFA',
}
let MASTER_KEYS = (await auth(config.DefaultVault)) as ISEAPair
export const getLockerName = async (compressed: string) => {
  let decompressed = lzStr.decompressFromEncodedURIComponent(compressed)
  if (decompressed) {
    return await Gun.SEA.decrypt(decompressed, MASTER_KEYS)
  }
  err('Failed to decrypt locker name. Check your master keys.')
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
if (!exists(config.LockerDirectory)) {
  console.log(chalk.white.italic(`No vaults found in configured vault directory...Starting ChainLocker vault setup.`))
  await mkdir(config.LockerDirectory)
}

await Run('root', config.DefaultVault)
export default async function Run(path = 'root-node', vault: string = config.DefaultVault) {
  let keys = await auth(vault)
  let secureVault = lzStr.compressToEncodedURIComponent(await SEA.encrypt(vault, await auth(config.DefaultVault)))
  let $LOCKER_PATH = interpretPath(config.LockerDirectory)
  let gun: IGunInstance<any>

  try {
    if (!exists(`${$LOCKER_PATH}/${secureVault}`)) {
      await mkdir(config.LockerDirectory, secureVault)
    }
    gun = new Gun({ file: interpretPath(config.LockerDirectory, secureVault) })
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
      console.log(command, opt, args, '\n', runner)

      const chainlockerOpts = new Map([
        [
          'help',
          async function (args: string[] = []) {
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
            let [key, value, ...flags] = args
            await Store(args, vault, gun)
          },
        ],
      ])
      if (command === 'chainlocker') {
        let run = chainlockerOpts.get(opt)
        if (run) {
          await run(args)
        }
      }
      // switch (command) {
      //   case 'chainlocker':

      //     break
      //   case 'get':
      //     if (!runner[1] && !path) {
      //       path = await question(`${chalk.white('Enter the path to desired node to retrieve raw data\n')}`)
      //       info(`${chalk.red.bold('>>--')}path/to/desired/node${chalk.red.bold('-->>')}  `)
      //     } else {
      //       path = runner[1]
      //     }
      //     if (path) {
      //       //@ts-ignore

      //       await Run(path)
      //     }
      //     break
      //   case 'put':
      //     if (!runner[1] && !path) {
      //       path = await question(`${chalk.white('Enter the path to desired node to put raw data\n')}`)
      //       info(`put ${chalk.red.bold('>>--')}path/to/desired/node${chalk.red.bold('-->>')} data `)
      //     } else {
      //       path = runner[1]
      //     }

      //     if (runner[2] === ('--file' || '-f')) {
      //       let file = runner[3].startsWith('/') ? `${runner[3]}` : `${process.cwd()}/${runner[3]}`
      //       let data = await read(process.cwd() + file)
      //       console.log(process.cwd())
      //       let patharr = path.split('/')
      //       let name = patharr[patharr.length - 1]
      //       //@ts-ignore
      //       gun.vault(path).put(data, (data) => {
      //         if (data.err) {
      //           warn(data.err)
      //         } else {
      //           console.log(data)
      //         }
      //       })
      //       await Run(path)
      //     }
      //     if (runner[2] === ('--url' || '-U')) {
      //       let url = runner[3]

      //       let data = await fetch(url)
      //       //@ts-ignore
      //       gun.vault(path).put(data, (data) => {
      //         if (data.err) {
      //           warn(data.err)
      //         } else {
      //           console.log(data)
      //         }
      //       })
      //     }
      //     if (runner[2] === ('--data' || '-d')) {
      //       let data = runner[3]
      //       let patharr = path.split('/')
      //       let name = patharr[patharr.length - 1]
      //       //@ts-ignore
      //       gun.vault(path).put(data, (data) => {
      //         if (data.err) {
      //           warn(data.err)
      //         } else {
      //           console.log(data)
      //         }
      //       })
      //     }

      //     break

      //   default:
      //     Help()
      //     break
      // }
      // await Run(path)
    }
  }
}
