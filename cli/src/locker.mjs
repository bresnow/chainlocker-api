import Gun from 'gun'
import { $, glob, chalk, question } from 'zx'
import { exists } from 'fsxx'
import { auth, getImmutableMachineInfo } from '../utils/auth.mjs'
import { err, info, warn } from '../utils/debug.mjs'
import lz from '../utils/lz-encrypt.mjs'
import lzStr from 'lz-string'
import LOG from '../utils/log.mjs'
import 'gun/lib/path.js'
import 'gun/lib/load.js'
import 'gun/lib/open.js'
import 'gun/lib/then.js'
const SEA = Gun.SEA

export default async function Locker() {
  Gun.chain.createLocker = async function (lockerName) {
    var _gun = this

    let keys = await auth(lockerName)
    let workedName = await SEA.work(lockerName, keys)
    let compath = lzStr.compressToUTF16(workedName)
    let $LOCKER_PATH = `${process.cwd()}/.chainlocker`
    let user = _gun.user()
    try {
      let mechIDs = getImmutableMachineInfo()
      mechIDs = await lz.encrypt(mechIDs, keys)
      user.auth(keys, (ack) => {
        if (!ack.err && !exists(`${$LOCKER_PATH}/${compath}`)) {
          user.get('lockers').get(workedName).put(mechIDs)
        }
      })
    } catch (error) {
      err(error)
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
  let $LOCKER_PATH = `${process.cwd()}/.chainlocker`,
    $BIN_PATH = ($LOCKER_PATH += '/bin')
  if (!exists($BIN_PATH)) {
    await $`mkdir -p ${$BIN_PATH}`
  }
  const bin = new Gun({ file: $BIN_PATH })
  let gun

  try {
    if (!exists(`${$LOCKER_PATH}/${compath}`)) {
      await $`mkdir -p ${$LOCKER_PATH}/${compath}`
      bin.get('BIN').get('LOCKER-LIST').set({ lockername })
    }
    gun = new Gun({ file: `${$LOCKER_PATH}/${compath}` })
    gun.createLocker(lockername)
  } catch (error) {
    err(error)
  }
  let user = gun.user().auth(keys, (ack) => {
    if (ack.err) {
      err(ack.err)
    }
    info('Authorized')
  })
  async function run() {
    let path
    let cmd = await question(chalk.white(`❱ ${lockername} ${chalk.green.bold(`-->>${path ?? 'root'}>`)}`))
    if (cmd) {
      cmd = cmd.trim()
      if (cmd) {
        let runner = cmd.split(' ')
        switch (runner[0]) {
          case 'get':
            if (!runner[1]) {
              path = await question(`${chalk.white('Enter the path to desired node to retrieve raw data\n')}`)
              info('get >>path/to/desired/node>>')
            } else {
              path = runner[1]
            }
            let nodepath = user.path(path)
            nodepath.put(await lz.encrypt({ test: 'data' }, keys))
            let data = await new Promise((resolve, reject) => {
              nodepath.load(function (data, key) {
                if (!data) {
                  warn(`No data available on node path ${path}`)
                } else {
                  resolve(data)
                }
              })
            })
            console.log(await lz.decrypt(data, keys))

            break
          case 'put':
            break
          case 'help':
            LOG('Available Commands', { level: 'info', tools: [{ title: 'help', text: 'List of Commands [current]' }] })
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
