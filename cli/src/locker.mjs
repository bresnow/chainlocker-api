import Gun from 'gun'
import { $, glob, chalk, question } from 'zx'
import { exists } from 'fsxx'
import { auth, getImmutableMachineInfo } from '../utils/auth.mjs'
import { err } from '../utils/debug.mjs'
import lz from '../utils/lz-encrypt.mjs'
import lzStr from 'lz-string'
import LOG from '../utils/log.mjs'
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

  async function run() {
    let cmd = await question(chalk.white(`❱ ${lockername} ${chalk.green('>root>')}`))
    if (cmd) {
      cmd = cmd.trim()
      if (cmd) {
        let runner = cmd.split(' ')
        switch (runner[0]) {
          case 'get':
            break
          case 'put':
            break
          case 'help':
            LOG('Available Commands', { level: 'info', tools: [{ title: 'help', text: 'List of Commands [current]' }] })
            break
          case 'peer':
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
