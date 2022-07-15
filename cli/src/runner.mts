//@ts-nocheck
import Gun from 'gun'
import { $, fetch, glob, chalk, question } from 'zx'
import { checkIfThis } from '../lib/check.mjs'
import { exists, read, write } from 'fsxx'
import { auth, getImmutableMachineInfo } from '../lib/auth.mjs'
import { err, info, warn } from '../lib/debug.mjs'
import Help from '../lib/help.mjs'
import '../lib/chain-hooks/chainlocker.mjs'
import lz from '../lib/lz-encrypt.mjs'
import lzStr from 'lz-string'
import getArgs from '../lib/arg.mjs'
import 'gun/lib/path.js'
import 'gun/lib/load.js'
import 'gun/lib/open.js'
import 'gun/lib/then.js'
const SEA = Gun.SEA

/**
 * The  directory that stores all the vaults and their data. Vault names are hashed with POW algorithm then compressed to URI safe utf16 characters.
 * @param lockername the name of the locker
 * @param keys  - The keys to use for encryption
 * @param vaultDirectory  the directory to store the locker in if a custom directory is chosen
 * @returns workedName the name of the locker directory
 * returns $LOCKER_PATH the path to the locker directory
 */

export function validateKeys(gun, keys) {
  return new Promise((resolve, reject) => {
    gun.user().auth(keys, (ack) => {
      let { err, get, sea } = ack ?? {}
      if (err) {
        reject(err)
      } else {
        resolve({ sea })
      }
    })
  })
}

let lockername = await question(chalk.white.bold('Enter desired vault name or choose a new name to create a new vault\n'))

if (lockername) {
  lockername = lockername.trim()
}
Help()
console.log('\n\n')
await Run('root')
export default async function Run(path) {
  let keys = await auth(lockername)
  let workedName = await SEA.work(lockername, keys, null, { name: 'SHA-256', length: 12 })
  let $LOCKER_PATH = `${process.cwd()}/.chainlocker`
  let gun, prevVault, public

  try {
    if (!exists(`${$LOCKER_PATH}/${lockername}`)) {
      await $`mkdir -p ${$LOCKER_PATH}/${lockername}`
    }
    gun = new Gun({ file: `${$LOCKER_PATH}/${lockername}` })

    gun.locker(lockername)
  } catch (error) {
    err(error)
  }
  const check = {
    async auth(keys: ISEAPair) {
      try {
        await validateKeys(gun, keys)
        return { valid: true, keys }
      } catch (error) {
        err(`${error}\n INVALID KEYPAIR FOR ${lockername}`)
        return { valid: false, keys }
      }
    },
  }
  let cmd = await question(chalk.white(`Current Node ❱ ${chalk.red.bold('>>')}${path ?? 'root'}${chalk.red.bold('-->>')}   `))
  if (cmd) {
    cmd = cmd.trim()
    if (cmd) {
      let runner = cmd.split(' ')
      switch (runner[0]) {
        case 'get':
          if (!runner[1] && !path) {
            path = await question(`${chalk.white('Enter the path to desired node to retrieve raw data\n')}`)
            info(`get ${chalk.red.bold('>>--')}path/to/desired/node${chalk.red.bold('-->>')}  `)
          } else {
            path = runner[1]
          }
          if (path) {
            gun.locker.path(path, (data) => {
              if (data.err) {
                warn(data.err)
              } else {
                console.log(data)
              }
            })
            await Run(path)
          }
          break
        case 'put':
          if (!runner[1] && !path) {
            path = await question(`${chalk.white('Enter the path to desired node to put raw data\n')}`)
            info(`put ${chalk.red.bold('>>--')}path/to/desired/node${chalk.red.bold('-->>')} data `)
          } else {
            path = runner[1]
          }
          console.log(getArgs(runner))

          if (runner[2] === ('--file' || '-f')) {
            let file = runner[3].startsWith('/') ? `${runner[3]}` : `${process.cwd()}/${runner[3]}`
            let data = await read(process.cwd() + file)
            console.log(process.cwd())
            let patharr = path.split('/')
            let name = patharr[patharr.length - 1]

            gun.locker.put(path, data)
            await Run(path)
          }
          if (runner[2] === ('--url' || '-U')) {
            let url = runner[3]

            let data = await fetch(url)
            console.log(data)
            // gun.locker.put(path,{ data}, (data) => {
            //     if (data.err) {
            //         warn(data.err)
            //     } else {
            //         console.log(data)
            //     }
            // })
          }
          if (runner[2] === ('--data' || '-d')) {
            let data = runner[3]
            let patharr = path.split('/')
            let name = patharr[patharr.length - 1]
            gun.locker.put(path, { data }, (data) => {
              if (data.err) err(data.err)
            })
          }

          break
        case 'peer':
          var peers = gun.back('opt.peers')
          console.log('PEERS', peers)
          var mesh = gun.back('opt.mesh') // DAM
          console.log('MESH', JSON.stringify(mesh))
          // if (Array.isArray(peers)) {
          //   peers.forEach((peer) => {
          //     mesh.bye(peer);
          //   });
          // }
          // mesh.bye(peers);

          // mesh.say({
          //   dam: 'opt',
          //   opt: {
          //     peers: typeof peers === 'string' ? peers : peers.map((peer) => peer),
          //   },
          // });
          break
        case 'deploy':
          break
        case 'exit':
          process.exit()
        case 'serve':
          break
        default:
          Help()
          break
      }
      await Run(path)
    }
  }
}
