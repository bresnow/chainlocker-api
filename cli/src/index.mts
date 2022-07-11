import Gun, { ISEAPair } from 'gun'
import { $, glob, question } from 'zx'
import os from 'os'
import { auth } from '../utils/auth.mjs'
import { lzObject } from 'lz-object'
import Pair from '../../lib/encryption/pair.mjs'
import { checkIfThis } from '../utils/check.mjs'
import getArgs from '../utils/arg.mjs'
import './create.mjs'
import { err } from '../utils/debug.mjs'
export default async function CreateLocker(lockerName: string) {
  if (!lockerName) {
    err('Please enter a name for the locker')
    return
  }
  let gun = new Gun()
  ;(gun as any).createLocker(lockerName)
}
let lockername = await question('Enter the name of the locker')
if (lockername) {
  lockername = lockername.trim()
  await CreateLocker(lockername)
}
