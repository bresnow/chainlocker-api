'use strict'
import { lzObject } from 'lz-object'
import { checkIfThis } from './check.mjs'
import { err } from './debug.mjs'
import Gun from 'gun'
async function encrypt(object, encryptionkey, compressionOptions) {
  let obj = {}
  if (object && checkIfThis.isObject(object)) {
    const entries = Object.entries(object)
    for (let i = 0; i < entries.length; i += 1) {
      const [objectKey, objectValue] = entries[i]
      if ((encryptionkey && checkIfThis.isString(objectValue)) || checkIfThis.isBoolean(objectValue) || checkIfThis.isNumber(objectValue)) {
        try {
          let encrypted = await Gun.SEA.encrypt(objectValue, encryptionkey)
          Object.assign(obj, { [objectKey]: encrypted })
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
        let decrypted = await Gun.SEA.decrypt(objectValue, encryptionkey)
        Object.assign(obj, { [objectKey]: decrypted })
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
