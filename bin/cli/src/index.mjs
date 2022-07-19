'use strict'
import { question, chalk, sleep } from 'zx'
import { exists, mkdir } from '../lib/file-utils.mjs'
import Gun from 'gun'
import '../lib/chain-hooks/chainlocker.mjs'
import { findArg } from '../lib/arg.mjs'
import config from '../../config/index.mjs'
import { MASTER_KEYS } from '../lib/auth.mjs'
import lzString from 'lz-string'
const caret = chalk.green.bold('\n\u2771 ')
let gun = Gun()
export const getCID = async (vaultname2, keypair) => lzString.compressToEncodedURIComponent(await Gun.SEA.work(vaultname2, keypair))
export const isDashedOption = (option) => option.startsWith('-')
let hasSalt = false
let [vault, vaultname] = findArg('vault', { dash: false })
if (!vault) {
  vaultname = await question(chalk.white.bold(`Enter desired vault name${caret}`))
}
if (vaultname && typeof vaultname === 'string') {
  let keypair = MASTER_KEYS,
    cID
  let [pair, salt] = findArg('pair', { dash: true })
  if (pair) {
    if (!salt) {
      salt = await question(
        chalk.white.bold(`Enter a unique but ${chalk.bold.green(`memorable`)} string as a passphrase/salt for a new keypair 
${chalk.yellowBright(`WARNING: If you enter the wrong password then a new, empty vault will be created.`)}${caret}`)
      )
    }
    if (salt) {
      hasSalt = true
    }
  }
  if (hasSalt && typeof salt === 'string') {
    let pass = salt.split(/[\t\ ]/g)
    keypair = await gun.keys(pass)
  }
  vaultname = vaultname.trim()
  cID = await getCID(vaultname, keypair)
  if (!exists(`${config.radDir}/${cID}`)) {
    console.log(chalk.green(`Creating new vault ${vaultname} in 3 seconds...`))
    console.log(
      chalk.yellow(
        `If you were trying to access an existing vault, you may need to exit ${chalk.white.italic(
          `[CTRL-C]`
        )} and re-enter your password.${caret}`
      )
    )
    await sleep(3e3)
    mkdir(`${config.radDir}/${cID}`)
  }
  gun = Gun({ file: `${config.radDir}/${cID}` })
  let user = gun.vault(vaultname, { keys: keypair })
  user.get(`chainlocker`).once((data) => {
    if (data) {
      if (data.vault && data.vault_id !== cID) {
        throw new Error(`Err authenticating ${vaultname}`)
      }
    }
    if (!data) {
      user.get(`chainlocker`).put({ vault: vaultname, vault_id: cID, config: { rad_directory: config.radDir } })
    }
  })
  let [action, ...actioncmds] = findArg('store', { dash: false, valueIsArray: true })
  let [actionf, ...actionOptsf] = findArg('fetch', { dash: false, valueIsArray: true })
  if (actionf) {
    action = 'fetch'
    if (actionOptsf) {
      actioncmds = actionOptsf
    }
  }
  if (!action) {
    async function storeFetchPrompt() {
      action = await question(
        chalk.white.bold(`Do you want to ${chalk.bold.green(`store`)} or ${chalk.bold.green(`fetch`)} data in ${vaultname}?${caret}`),
        { choices: ['store', 'fetch'] }
      )
      if (action !== 'store') {
        console.log(chalk.red(`${action} is not a valid option. Try again...`))
        await storeFetchPrompt()
      }
      return action
    }
    action = await storeFetchPrompt()
  }
  if (action) {
    let antwoord = await question(
      chalk.white.bold(`Input the path to desired locker (database node) 
ChainLocker node paths can be separated by " "${chalk.bold.green(`< space >`)}, or "\\t"${chalk.bold.green(`< tab >`)}${caret}`)
    )
    actioncmds = antwoord.split(/[\t\ ]/g)
  }
  if (actioncmds.length > 0) {
    let nodepath = []
    let arrItr = actioncmds
    let actionopts = []
    let iterator = arrItr.values()
    for (const val of iterator) {
      if (val) {
        if (isDashedOption(val)) {
          actionopts.push([val.replace(/-/g, '').trim(), iterator.next().value])
        } else {
          nodepath.push(val)
        }
      }
    }
    if (actionopts.length < 1) {
      let opt = await question(
        chalk.white.bold(`Enter the ${chalk.bold.green(`type`)} of data you would like to store at path ${chalk.bold.green(nodepath)}
 Input ${chalk.bold.italic(`${chalk.italic.cyan(`--stdin`)}, ${chalk.italic.cyan(`--file`)}, or ${chalk.italic.cyan(`--url`)}`)}${caret}`),
        { choices: ['--stdin', '--file', '--url'] }
      )
      let arr = opt.split(/[\t\ ]/g)
      let iterator2 = arr.values()
      for (const val of iterator2) {
        if (val) {
          if (isDashedOption(val)) {
            let option = val.replace(/-/g, '').trim()
            let _value = iterator2.next().value
            if (!_value) {
              if (option === 'stdin') {
                _value = await question(
                  chalk.white.bold(`Input string in stdin to store at path ${chalk.bold.green(nodepath.join(' \u2771'))}${caret}`)
                )
              }
              if (option === 'file') {
                _value = await question(
                  chalk.white.bold(`Input path to file to store at path ${chalk.bold.green(nodepath.join(' \u2771'))}${caret}`)
                )
              }
              if (option === 'url') {
                _value = await question(
                  chalk.white.bold(`Input url to store at path ${chalk.bold.green(nodepath.join(' \u2771'))}${caret}`)
                )
              }
            }
            actionopts.push([option, _value])
          }
        }
      }
    }
    console.log(nodepath, actionopts)
    nodepath = nodepath.map((path) => path.trim())
    console.log(chalk.green(`${vaultname} \u2771\u2771\u2771--${nodepath.join('\u2771')}--\u2771\u2771`))
  }
  process.exit(0)
}
