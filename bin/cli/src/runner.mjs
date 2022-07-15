'use strict'
import Gun from 'gun'
import { chalk, question } from 'zx'
import { exists } from 'fsxx'
import { auth } from '../lib/auth.mjs'
import { err } from '../lib/debug.mjs'
import { interpretPath, mkdir } from '../lib/file-utils.mjs'
import Vault from './commands/vault.mjs'
import Help from '../lib/help.mjs'
import '../lib/chain-hooks/chainlocker.mjs'
import lzStr from 'lz-string'
import 'gun/lib/path.js'
import 'gun/lib/load.js'
import 'gun/lib/open.js'
import 'gun/lib/then.js'
import Store from './commands/store.mjs'
const SEA = Gun.SEA
let config = {
  MASTER_KEYS: process.env.MASTER_KEYS || {
    pub: 'SECRETKEYS_PLEASECHANGE',
    priv: '_PLEASE_CHANGE_THIS_KEY',
    epub: '_OR_YOUWILLBEHACKED',
    epriv: '_ONCEAGAIN_CHANGE!!!',
  },
  LockerDirectory: process.env.LOCKER_DIRECTORY || '.chainlocker',
  DefaultVault: process.env.LOCKER_NAME || 'default',
  defaultRootNode: process.env.DEFAULT_ROOT_NODE ?? 'root',
  directoryPrefix: 'MoUQgg3gRAxgLlAXFA',
}
export const getLockerName = async (compressed) => {
  compressed = config.directoryPrefix + compressed
  let decompressed = lzStr.decompressFromEncodedURIComponent(compressed)
  if (decompressed) {
    return await Gun.SEA.decrypt(decompressed, config.MASTER_KEYS)
  }
  err('Failed to decrypt locker name. Check your master keys.')
}
let masterPair = await auth(config.MASTER_KEYS)
export function validateKeys(keys = config.MASTER_KEYS) {
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
if (!exists(config.LockerDirectory)) {
  console.log(chalk.white.italic(`No vaults found in configured vault directory...Starting ChainLocker vault setup.`))
  await mkdir(config.LockerDirectory)
}
await Run('root', config.DefaultVault)
export default async function Run(path = 'root-node', vault = config.DefaultVault) {
  let keys = await auth(vault)
  let secureVault = lzStr
    .compressToEncodedURIComponent(await SEA.encrypt(vault, config.MASTER_KEYS.epriv))
    .replace('MoUQgg3gRAxgLlAXFA', '')
  let $LOCKER_PATH = interpretPath(config.LockerDirectory)
  let gun
  try {
    if (!exists(`${$LOCKER_PATH}/${secureVault}`)) {
      await mkdir(config.LockerDirectory, secureVault)
    }
    gun = new Gun({ file: interpretPath(config.LockerDirectory, secureVault) })
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
      console.log(command, opt, args, '\n', runner)
      const chainlockerOpts = /* @__PURE__ */ new Map([
        [
          'help',
          async function (args2 = []) {
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
            let [key, value, ...flags] = args2
            await Store(args2, vault, gun)
          },
        ],
      ])
      if (command === 'chainlocker') {
        let run = chainlockerOpts.get(opt)
        if (run) {
          await run(args)
        }
      }
    }
  }
}
