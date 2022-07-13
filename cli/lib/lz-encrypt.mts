import { ISEAPair } from 'gun'
import { lzObject } from 'lz-object'
import { checkIfThis } from './check.mjs'
import { err, info } from './debug.mjs'
import Gun from 'gun'
/**
 *
 * LZ-Encrypt uses the sea algorith to encrypt/decrypt and compress/decompresswith lz-string.
 * The methods only effect the object values as to easily traverse graph nodes
 */
async function encrypt(
  object: any,
  encryptionkey: ISEAPair | { epriv: string },
  compressionOptions?: Partial<{ compress: boolean; encoding: 'utf16' | 'uint8array' | 'base64' | 'uri' }>
) {
  let obj: Record<string, any> = {}
  if (object && checkIfThis.isObject(object)) {
    const entries = Object.entries(object)
    for (let i = 0; i < entries.length; i += 1) {
      const [objectKey, objectValue] = entries[i]

      if ((encryptionkey && checkIfThis.isString(objectValue)) || checkIfThis.isBoolean(objectValue) || checkIfThis.isNumber(objectValue)) {
        try {
          let encrypted = await Gun.SEA.encrypt(objectValue, encryptionkey)
          Object.assign(obj, { [objectKey]: encrypted })
        } catch (error) {
          throw new Error(error as string)
        }
      }
      if (encryptionkey && checkIfThis.isObject(objectValue)) {
        await encrypt(objectValue, encryptionkey)
      }
    }
    // console.log(JSON.stringify(lzObject.compress(obj, { output: 'uint8array'}), null, 2))
    obj = lzObject.compress(obj, { output: 'utf16' })
    return obj
  }
}
async function decrypt(object: any, encryptionkey: ISEAPair | { epriv: string }) {
  if (!object) {
    err('cannot decrypt and decompress object as it is undefined')
    // throw new Error('cannot decrypt and decompress object as it is undefined');
  }
  object = lzObject.decompress(object, { output: 'utf16' })
  let obj: Record<string, any> = {}
  if (checkIfThis.isObject(object)) {
    const entries: [string, string | any][] = Object.entries(object)
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

// const test = { test: 'njsanj1', test1: 'ajbsdkjasbda2', test11: 'dkjasbdksj3', test111: 'sadahsbdkshda', testyyyy: 'TESTERRRRR' },
//   enc = { epriv: 'khjksbkdjbsajkbdljkasblfsbdajkfbsdkjfbasdklfbasljdbfskdjb' }
// console.info(`encrypting test object`)
// let encrypted = await encrypt(test, enc)
// info(JSON.stringify(encrypted, null, 2))
// console.info(`decrypting test object`)
// let decrypted = await decrypt(encrypted, enc)
// info(JSON.stringify(decrypted, null, 2))
