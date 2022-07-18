'use strict'
import { question, chalk } from 'zx'
import { exists, mkdir } from '../lib/file-utils.mjs'
import Gun from 'gun'
import '../lib/chain-hooks/chainlocker.mjs'
import { findArg } from '../lib/arg.mjs'
import config from '../../config/index.mjs'
import { MASTER_KEYS, SysUserPair } from '../lib/auth.mjs'
import lzString from 'lz-string'
export const getCID = async (vaultname2, keypair) => lzString.compressToEncodedURIComponent(await Gun.SEA.work(vaultname2, keypair))
let gun
let [vault, vaultname] = findArg('vault', { dash: false })
if (!vault || !vaultname) {
  vaultname = await question(
    chalk.white.bold(`Enter desired vault name 
  \u2771  `)
  )
}
if (vaultname) {
  let keypair = MASTER_KEYS,
    cID
  let [pair, salt] = findArg('pair', { dash: true })
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
  cID = await getCID(vaultname, keypair)
  if (!exists(config.radDir + `${cID}`)) {
    mkdir(`${config.radDir}/${cID}`)
  }
  gun = Gun({ file: `${config.radDir}/${cID}` })
  gun.vault(vaultname, { keys: keypair })
  let lock = gun.locker('test/a/rooonie')
  lock.put({ test: 'ICKLE' }, (data) => {
    if (data.err) {
      console.log(data.err)
    }
  })
  lock.value((data) => {
    console.log(data)
  })
}
