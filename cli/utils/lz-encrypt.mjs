'use strict'
import { lzObject } from 'lz-object'
import { checkIfThis } from './check.mjs'
import { err, info } from './debug.mjs'
import Gun from 'gun'
async function encrypt(object, encryptionkey) {
  let obj = {}
  if (object && checkIfThis.isObject(object)) {
    const entries = Object.entries(object)
    for (let i = 0; i < entries.length; i += 1) {
      const [objectKey, objectValue] = entries[i]
      if ((encryptionkey && checkIfThis.isString(objectValue)) || checkIfThis.isBoolean(objectValue) || checkIfThis.isNumber(objectValue)) {
        try {
          let encrypted2 = await Gun.SEA.encrypt(objectValue, encryptionkey)
          Object.assign(obj, { [objectKey]: encrypted2 })
        } catch (error) {
          throw new Error(error)
        }
      }
      if (encryptionkey && checkIfThis.isObject(objectValue)) {
        await encrypt(objectValue, encryptionkey)
      }
    }
    obj = lzObject.compress(obj, { output: 'utf16' })
    return obj
  }
}
async function decrypt(object, encryptionkey) {
  if (!object) {
    err('cannot decrypt and decompress object as it is undefined')
  }
  object = lzObject.decompress(object, { output: 'utf16' })
  let obj = {}
  if (checkIfThis.isObject(object)) {
    const entries = Object.entries(object)
    for (let i = 0; i < entries.length; i += 1) {
      const [objectKey, objectValue] = entries[i]
      if (encryptionkey && checkIfThis.isString(objectValue)) {
        let decrypted2 = await Gun.SEA.decrypt(objectValue, encryptionkey)
        Object.assign(obj, { [objectKey]: decrypted2 })
      }
      if (encryptionkey && checkIfThis.isObject(objectValue)) {
        await decrypt(objectValue, encryptionkey)
      }
    }
  }
  return obj
}
export default {
  encrypt,
  decrypt,
}
const test = { test: 'njsanj1', test1: 'ajbsdkjasbda2', test11: 'dkjasbdksj3', test111: 'sadahsbdkshda', testyyyy: 'TESTERRRRR' },
  enc = { epriv: 'khjksbkdjbsajkbdljkasblfsbdajkfbsdkjfbasdklfbasljdbfskdjb' }
console.info(`encrypting test object`)
let encrypted = await encrypt(test, enc)
info(JSON.stringify(encrypted, null, 2))
console.info(`decrypting test object`)
let decrypted = await decrypt(encrypted, enc)
info(JSON.stringify(decrypted, null, 2))
