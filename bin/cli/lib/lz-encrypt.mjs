'use strict'
import { lzObject } from 'lz-object'
import lzString from 'lz-string'
import { checkIfThis } from './check.mjs'
import { err } from './debug.mjs'
import Gun from '../gun/index.mjs'
async function encrypt(object, encryptionkey, compressionOptions) {
  let compressionType = compressionOptions?.encoding ?? 'utf16'
  let compress
  if (typeof object === 'string') {
    let encrypted = await Gun.SEA.encrypt(object, encryptionkey)
    switch (compressionType) {
      case 'utf16':
        compress = lzString.compressToUTF16
        break
      case 'uint8array':
        compress = lzString.compressToUint8Array
        break
      case 'base64':
        compress = lzString.compressToBase64
        break
      case 'uri':
        compress = lzString.compressToEncodedURIComponent
        break
      default:
        err('Unknown compression type')
        compress = lzString.compressToUTF16
        break
    }
    let compressed = compress(encrypted)
    return compressed
  }
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
async function decrypt(object, encryptionkey, compressionOptions) {
  if (!object) {
    err('cannot decrypt and decompress object as it is undefined')
  }
  let decompressionType = compressionOptions?.encoding ?? 'utf16'
  if (typeof object === 'string') {
    let decomp
    let decrypted
    switch (decompressionType) {
      case 'utf16':
        decomp = lzString.decompressFromUTF16(object)
        decrypted = decomp && Gun.SEA.decrypt(decomp, encryptionkey)
        break
      case 'base64':
        decomp = lzString.decompressFromBase64(object)
        decrypted = decomp && Gun.SEA.decrypt(decomp, encryptionkey)
        break
      case 'uri':
        decomp = lzString.decompressFromEncodedURIComponent(object)
        decrypted = decomp && Gun.SEA.decrypt(decomp, encryptionkey)
        break
      default:
        err('Unknown compression type')
        decomp = lzString.decompressFromUTF16(object)
        decrypted = decomp && Gun.SEA.decrypt(decomp, encryptionkey)
        break
    }
    return decrypted
  }
  object = lzObject.decompress(object, { output: compressionOptions?.encoding ?? 'utf16' })
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
