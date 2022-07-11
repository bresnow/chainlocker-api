import Gun, { ISEAPair } from 'gun'
import { $, glob } from 'zx'
import os from 'os'
import { auth } from '../utils/auth.mjs'
import { lzObject } from 'lz-object'
import Pair from '../../lib/encryption/pair.mjs'
import { checkIfThis } from '../utils/check.mjs'
//@ts-ignore
Gun.chain.replace = function (replacement) {
  // grab a reference to gun
  var gun = this

  console.log(replacement)
  gun.get('does').get('it').put(replacement)

  return gun
}

const gun = new Gun()
//@ts-ignore
gun.replace({ work: 'yes' })
// let keypair
// try {
//    keypair = await auth('ThisBeMePassword')
// gun.user().auth(keypair, (ack:any)=> {
//     if (ack.err) {
//         console.error(ack.err)
//     }
//     console.log(ack)
//     console.log('YESSSSS')
// }).get('poowater').put({ lenon:'lemon' })
// } catch (err:any) {
//     console.error(err)
// }
