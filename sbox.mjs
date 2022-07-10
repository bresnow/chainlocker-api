import Pair from './bin/lib/encryption/pair.mjs'
import Gun from 'gun'
im

let gun = Gun({ radisk: false })
let key = 'JOOOOOO',
  name = 'buuttt'
let pair = await Pair(key, name)

gun.user().auth(pair, (ack) => {
  if (ack.err) {
    console.error(ack.err)
  }
  console.log(ack)
})
