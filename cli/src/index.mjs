'use strict'
import Gun from 'gun'
import { question } from 'zx'
import './create.mjs'
import { err } from '../utils/debug.mjs'
export default async function CreateLocker(lockerName) {
  if (!lockerName) {
    err('Please enter a name for the locker')
    return
  }
  let gun = new Gun()
  gun.createLocker(lockerName)
}
let lockername = await question('Enter the name of the locker')
if (lockername) {
  lockername = lockername.trim()
  await CreateLocker(lockername)
}
