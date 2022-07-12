import Gun from 'gun'
import { $, glob, chalk, question } from 'zx'
import { checkIfThis } from '../utils/check.mjs'
import { exists, read, write } from 'fsxx'
import { auth, getImmutableMachineInfo } from '../utils/auth.mjs'
import { err, info, warn } from '../utils/debug.mjs'
import lz from '../utils/lz-encrypt.mjs'
import lzStr from 'lz-string'
import LOG from '../utils/log.mjs'
import axios from 'redaxios'
import 'gun/lib/path.js'
import 'gun/lib/load.js'
import 'gun/lib/open.js'
import 'gun/lib/then.js'
const SEA = Gun.SEA

export default async function Locker() {
  Gun.chain.locker = async function (lockerName) {
    let $LOCKER_PATH = `${process.cwd()}/.chainlocker`
    var _gun = this
    let user = _gun.user()
    let keys = await auth(lockerName)
    let workedName = await SEA.work(lockerName, keys)
    let compath = lzStr.compressToUTF16(workedName)
    let mechIDs = getImmutableMachineInfo()
    mechIDs = await lz.encrypt({ mechIDs, workedName }, keys)
    _gun.on('auth', (ack) => {
      console.log('Auth')
      if (!ack.err && !exists(`${$LOCKER_PATH}/${compath}`)) {
        user.get('info').put(mechIDs)
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

  let lockername = await question(chalk.white('Enter the name of the locker \n\n'))

  if (lockername) {
    lockername = lockername.trim()
  }
  let keys = await auth(lockername)
  let workedName = await SEA.work(lockername, keys, null, { name: 'SHA-256', length: 12 })
  let compath = lzStr.compressToUTF16(workedName)
  let $LOCKER_PATH = `${process.cwd()}/.chainlocker`
  let gun

  try {
    if (!exists(`${$LOCKER_PATH}/${compath}`)) {
      await $`mkdir -p ${$LOCKER_PATH}/${compath}`
    }
    gun = new Gun({ file: `${$LOCKER_PATH}/${compath}` })
    gun.locker(lockername)
  } catch (error) {
    err(error)
  }

  async function run(path) {
    let cmd = await question(chalk.white(`❱ ${lockername} ${chalk.red.bold('>>--')}${path ?? 'root'}${chalk.red.bold('-->>')}   `))
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
              await run(path)
            }
            break
          case 'put':
            if (!runner[1] && !path) {
              path = await question(`${chalk.white('Enter the path to desired node to put raw data\n')}`)
              info(`put ${chalk.red.bold('>>--')}path/to/desired/node${chalk.red.bold('-->>')} data `)
            } else {
              path = runner[1]
            }
            if (path !== (`root` || undefined)) {
              for (let i = 0; i < runner.length; i++) {
                if (runner[i] === ('--file' || '-f')) {
                  let file = runner[i + 1]
                  console.log(process.cwd() + file, 'file')
                  let data = await read(process.cwd() + file)
                  gun.locker.put(path, data)
                }
                if (runner[i] === ('--url' || '-U')) {
                  i++
                  let urls = runner[i].split(',').flatMap((url) => url.trim())
                  for (let url of urls) {
                    let { data } = await axios.get(url)
                    console.log(data)
                    gun.locker.put(path, data, (data) => {
                      if (data.err) {
                        warn(data.err)
                      } else {
                        console.log(data)
                      }
                    })
                  }
                }
                if (runner[i] === ('--data' || '-d')) {
                  let data = runner[i + 1]
                  gun.locker.put(path, data, (data) => {
                    if (data.err) err(data.err)
                  })
                }
              }

              await run(path)
            }
            break
          case 'peer':
            break
          case 'deploy':
            break
          case 'serve':
            break
          default:
            LOG('Available Commands', { level: 'info', tools: [{ title: 'help', text: 'List of Commands [current]' }] })
            break
        }
      }
    }
    await run()
  }
  await run()
}

await Locker()
