'use strict'
import Gun from 'gun'
Gun.chain.replace = function (replacement) {
  var gun2 = this
  console.log(replacement)
  gun2.get('does').get('it').put(replacement)
  return gun2
}
const gun = new Gun()
gun.replace({ work: 'yes' })
