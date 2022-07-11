import Gun from 'gun'
import { $, glob, chalk, question } from 'zx'
import { auth } from '../utils/auth.mjs'
import { err } from '../utils/debug.mjs'
import lz from '../utils/lz-encrypt.mjs'

const SEA = Gun.SEA
export default async function CreateLocker() {
  Gun.chain.createLocker = async function (lockerName) {
    var _gun = this

    let keys = await auth(lockerName)
    let workedName = await SEA.work(lockerName, keys)
    let user = _gun.user()
    try {
      let lockerdata = {
        name: lockerName,
      }
      lockerdata = await lz.encrypt(lockerdata, keys)
      user.auth(keys, (ack) => {
        if (!ack.err) {
          user.get('lockers').get(workedName).put(lockerdata)
        }
      })
    } catch (error) {
      err(error)
    }
    user
      .get('lockers')
      .get(workedName)
      .once((data) => console.log(data))
    return _gun
  }
  let lockername = await question(chalk.white('Enter the name of the locker \n'))
  if (lockername) {
    lockername = lockername.trim()
  }

  let keys = await auth(lockername)
  let workedName = await SEA.work(lockername, keys)
  try {
    await $`mkdir -p ${workedName}`
  } catch (error) {
    err(error)
  }
  let gun = new Gun({ file: workedName })
  gun.createLocker(lockername)
}

await CreateLocker()
