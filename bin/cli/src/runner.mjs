'use strict'
import Gun from 'gun'
import { $, chalk, question } from 'zx'
import { exists } from 'fsxx'
import { auth, getImmutableMachineInfo } from '../lib/auth.mjs'
import { err, warn } from '../lib/debug.mjs'
import Vault from './commands/vault.mjs'
import Help from '../lib/help.mjs'
import Push from '../lib/dev/push.mjs'
import Build from '../lib/dev/build.mjs'
import lzStr from 'lz-string'
import Store from './commands/store.mjs'
import config from '../../config/index.mjs'
import Pair from '../lib/encryption/pair.mjs'
const SEA = Gun.SEA
let machine = getImmutableMachineInfo()
let MASTER_KEYS = await Pair(config, Object.values(machine))
export const getLockerName = async (compressed) => {
  let decompressed = lzStr.decompressFromUTF16(compressed)
  if (decompressed) {
    return await Gun.SEA.decrypt(decompressed, MASTER_KEYS)
  }
  err('Failed to decrypt locker name. Check your master keys.')
}
export function validateKeys(keys = MASTER_KEYS) {
  return new Promise((resolve, reject) => {
    Gun()
      .user()
      .auth(keys, (ack) => {
        let { err: err2, get, sea } = ack
        if (err2) {
          reject(err2)
        } else {
          resolve({ sea })
        }
      })
  })
}
await Run()
export default async function Run(path = 'root-node', vault = config.DefaultVault) {
  let keys = await auth(vault)
  let worked = await SEA.work(vault, MASTER_KEYS)
  let secureVault = lzStr.compressToUTF16(worked)
  let $LOCKER_PATH = config.LockerDirectory + '/' + secureVault
  let gun
  try {
    if (!exists($LOCKER_PATH)) {
      console.log(chalk.white.italic(`New vault setup.`))
      await $`mkdir -p ${$LOCKER_PATH}`
    }
    gun = new Gun({ file: `${$LOCKER_PATH}` })
    gun.locker(vault)
  } catch (error) {
    err(error)
  }
  let cmd = await question(chalk.white(`Current Node \u2771 ${chalk.red.bold('>>')}${path ?? 'root'}${chalk.red.bold('-->>')}  `))
  if (cmd) {
    cmd = cmd.trim()
    if (cmd) {
      let runner = cmd.split(' ').map((x) => x.trim().toLocaleLowerCase())
      let [command, opt, ...args] = runner
      const chainlockerOpts = /* @__PURE__ */ new Map([
        [
          'help',
          async function (_args = []) {
            Help('chainlocker')
          },
        ],
        [
          'vault',
          async function (args2 = []) {
            await Vault(args2, vault, gun)
          },
        ],
        [
          'store',
          async function (args2 = []) {
            await Store(args2, vault, gun)
          },
        ],
        [
          'dev',
          async function (args2 = []) {
            let [key, value, ...flags] = args2
            if (key === 'push') {
              console.log(chalk.white.italic(`Pushing to github...`))
              try {
                await Build()
                await Push()
              } catch (error) {
                err(error)
              }
            }
            if (key === 'build') {
              console.log(chalk.white.italic(`Building...`))
              await Build()
            }
          },
        ],
      ])
      if (command === 'chainlocker') {
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
      if (command === 'exit') {
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
