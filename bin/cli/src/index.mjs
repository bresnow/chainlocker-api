'use strict'
import { question, chalk } from 'zx'
import { exists, mkdir } from '../lib/file-utils.mjs'
import Gun from 'gun'
import '../lib/chain-hooks/chainlocker.mjs'
import { findArg } from '../lib/arg.mjs'
import config from '../../config/index.mjs'
import { MASTER_KEYS } from '../lib/auth.mjs'
import { getCID } from '../lib/chain-hooks/chainlocker.mjs'
let gun,
  hasSalt = false,
  salt = ''
let [vault, vaultname] = findArg('vault', { dash: false })
if (!vault || !vaultname) {
  vaultname = await question(
    chalk.white.bold(`Enter desired vault name 
  \u2771  `)
  )
}
if (vaultname && typeof vaultname === 'string') {
  let keypair = MASTER_KEYS,
    cID
  let [pair, salt2] = findArg('pair', { dash: true })
  if (pair) {
    if (!salt2) {
      salt2 = await question(
        chalk.white.bold(`Enter a unique but memorable salt string **[password]** for a new keypair 
${chalk.yellowBright(`WARNING: If you enter the wrong password then a new, empty vault will be created.`)}  \u2771  `)
      )
    }
    if (salt2) {
      hasSalt = true
    }
  }
  cID = await getCID(vaultname, keypair)
  if (!exists(`${config.radDir}/${cID}`)) {
    console.log(chalk.green(`Creating new vault ${vaultname}`))
    mkdir(`${config.radDir}/${cID}`)
  }
  gun = Gun({ file: `${config.radDir}/${cID}` })
  if (hasSalt && typeof salt2 === 'string') {
    keypair = await gun.keys([vaultname, salt2])
  }
  gun.vault(
    vaultname,
    function (data) {
      console.log(data)
    },
    { keys: keypair }
  )
  let lock = gun.locker
  let [store, ...storeopts] = findArg('store', { dash: false, valueIsArray: true })
  if (store) {
    console.log(store, storeopts)
  }
}
