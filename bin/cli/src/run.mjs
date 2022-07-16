'use strict'
import Gun from '../gun/index.mjs'
import { $, fetch, glob, chalk, question } from 'zx'
import { checkIfThis } from '../lib/check.mjs'
import { exists, read, write } from 'fsxx'
import { auth, getImmutableMachineInfo } from '../lib/auth.mjs'
import { err, info, warn } from '../lib/debug.mjs'
import Help from '../lib/help.mjs'
import lz from '../lib/lz-encrypt.mjs'
import lzStr from 'lz-string'
import getArgs from '../lib/arg.mjs'
import 'gun/lib/path.js'
import 'gun/lib/load.js'
import 'gun/lib/open.js'
import 'gun/lib/then.js'
const SEA = Gun.SEA
export async function machineID_WorkSalt(lockername2, keys, vaultDirectory) {
  let workedName = await SEA.work(lockername2, keys, null, { name: 'SHA-256', length: 12 })
  let compath2 = lzStr.compressToUTF16(workedName)
  let $LOCKER_PATH = `${process.cwd()}/.${vaultDirectory ?? 'chainlocker'}`
  let mechID = getImmutableMachineInfo()
  return { workedName: compath2, $LOCKER_PATH, mechID }
}
export function validateKeys(gun, keys) {
  return new Promise((resolve, reject) => {
    gun.user().auth(keys, (ack) => {
      let { err: err2, get, sea } = ack ?? {}
      if (err2) {
        reject(err2)
      } else {
        resolve({ sea })
      }
    })
  })
}
Gun.chain.locker = async function (lockerName, vaultDirectory) {
  var _gun = this
  let user = _gun.user()
  let keys = await auth(lockerName)
  let { workedName, $LOCKER_PATH, mechID } = await machineID_WorkSalt(lockerName, keys, vaultDirectory)
  _gun.on('auth', (ack) => {
    if (!ack.err && !exists(`${$LOCKER_PATH}/${compath}`)) {
      user.get('init/locker').put({ info: mechID, workedName })
    }
  })
  user.auth(keys)
  _gun.locker = {
    path: async (path, cb) => {
      user.path(path).load(async (data) => {
        if (!data) return cb({ err: 'Record not found' })
        try {
          delete data._
          data = await lz.decrypt(data, keys)
          cb(data)
        } catch (error) {
          err(error)
        }
      })
    },
    put: async (path, data, cb) => {
      if (checkIfThis.isObject(data)) {
        data = await lz.encrypt(data, keys)
      } else {
        data = await lz.encrypt({ data }, keys)
      }
      user.path(path).put(data, cb)
    },
  }
  return _gun
}
export default async function Run(path) {
  let keys = await auth(lockername)
  let workedName = await SEA.work(lockername, keys, null, { name: 'SHA-256', length: 12 })
  let compath2 = lzStr.compressToUTF16(workedName)
  let $LOCKER_PATH = `${process.cwd()}/.chainlocker`
  let gun
  try {
    if (!exists(`${$LOCKER_PATH}/${lockername}`)) {
      await $`mkdir -p ${$LOCKER_PATH}/${lockername}`
    }
    gun = new Gun({ file: `${$LOCKER_PATH}/${compath2}` })
    gun.locker(lockername)
  } catch (error) {
    err(error)
  }
  let cmd = await question(chalk.white(`Current Node \u2771 ${chalk.red.bold('>>')}${path ?? 'root'}${chalk.red.bold('-->>')}   `))
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
          if (runner[2] === '--file') {
            let file = runner[3].startsWith('/') ? `${runner[3]}` : `${process.cwd()}/${runner[3]}`
            let data = await read(process.cwd() + file)
            console.log(process.cwd())
            let patharr = path.split('/')
            let name = patharr[patharr.length - 1]
            gun.locker.put(path, data)
            await Run(path)
          }
          if (runner[2] === '--url') {
            let url = runner[3]
            let data = await fetch(url)
            console.log(data)
          }
          if (runner[2] === '--data') {
            let data = runner[3]
            let patharr = path.split('/')
            let name = patharr[patharr.length - 1]
            gun.locker.put(path, { data }, (data2) => {
              if (data2.err) err(data2.err)
            })
          }
          break
        case 'peer':
          var peers = gun.back('opt.peers')
          console.log('PEERS', peers)
          var mesh = gun.back('opt.mesh')
          console.log('MESH', JSON.stringify(mesh))
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
let lockername = await question(chalk.white.bold('Enter the name of the locker\n'))
if (lockername) {
  lockername = lockername.trim()
}
await Run('root')
