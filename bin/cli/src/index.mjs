'use strict'
import { question, chalk } from 'zx'
import { exists, mkdir } from '../lib/file-utils.mjs'
import Gun from 'gun'
import '../lib/chain-hooks/chainlocker.mjs'
import { findArg } from '../lib/arg.mjs'
import config from '../../config/index.mjs'
import { MASTER_KEYS, SysUserPair } from '../lib/auth.mjs'
import lzString from 'lz-string'
let gun
let [vault, vaultname] = findArg('vault')
if (!vault) {
  vaultname = await question(
    chalk.white.bold(`Enter desired vault name 
  \u2771  `)
  )
}
if (vaultname) {
  let keypair = MASTER_KEYS,
    cID
  let [pair, salt] = findArg('pair', 2, { dash: true })
  if (pair) {
    if (!salt) {
      salt = await question(
        chalk.white.bold(`Enter a unique but memorable salt string for a new keypair 
  \u2771  `)
      )
    }
    if (salt) {
      let { keys } = await SysUserPair([vaultname, salt, JSON.stringify(MASTER_KEYS)])
      keypair = keys
    }
  }
  cID = lzString.compressToEncodedURIComponent(await Gun.SEA.work(vaultname, keypair))
  if (!exists(config.radDir + `${cID}`)) {
    mkdir(`${config.radDir}/${cID}`)
  }
  gun = Gun({ file: `${config.radDir}/${cID}` })
  gun.vault(vaultname)
  let lock = gun.locker('test/a/rooonie')
  lock.put({ tes: 'ICKLE' }, (data) => {
    if (data.err) {
      console.log(data.err)
    }
  })
  lock.value((data) => {
    console.log(data)
  })
}
