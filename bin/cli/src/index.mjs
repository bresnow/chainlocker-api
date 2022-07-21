#!/usr/bin/env node
'use strict'
import { question, chalk, $ } from 'zx'
import { exists } from '../lib/file-utils.mjs'
import Gun from 'gun'
import '../lib/chain-hooks/chainlocker.mjs'
import { findArg } from '../lib/arg.mjs'
import config from '../../config/index.mjs'
import { MASTER_KEYS } from '../lib/auth.mjs'
import { err } from '../lib/debug.mjs'
import lzString from 'lz-string'
const caret = chalk.green.bold('\n\u2771 ')
let gun = Gun()
console.clear()
export const getCID = async (vaultname, keypair) => lzString.compressToEncodedURIComponent(await Gun.SEA.work(vaultname, keypair))
export const isDashedOption = (option) => option.startsWith('-')
export default async function Start() {
  console.log(`${caret}${chalk.blue.bold('Welcome to the ChainLocker CLI')}${caret}`)
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
        chalk.yellowBright(
          `If you were trying to access an existing vault, you may need to exit ${chalk.white.italic(
            `[CTRL-C]`
          )} and re-enter your password.${caret}`
        )
      )
      try {
        await $`mkdir -p ${config.radDir}/${cID}`
      } catch (error) {
        err(error)
      }
    }
    gun = Gun({ file: `${config.radDir}/${cID}` })
    let vault2 = gun.vault(
      vaultname,
      (_ack) => {
        console.log(
          chalk.green(`Vault ${vaultname} Authorized. 
 public-key: ${keypair.pub} 
 pubic-encryption-key: ${keypair.epub}`)
        )
      },
      { keys: keypair }
    )
    gun.locker(['ChainLocker', `vault`, vaultname])
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
ChainLocker node paths can be separated by " " ${chalk.bold.green(`< space >`)}, or "\\t" ${chalk.bold.green(`< tab >`)}${caret}`)
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
        if (action === 'store') {
          async function actionOptPrompt() {
            let type2 = await question(
              chalk.white.bold(`Enter the ${chalk.bold.green(`type`)} of data you would like to store at path ${chalk.bold.green(nodepath)}
 Input ${chalk.bold.italic(`${chalk.italic.cyan(`stdin`)}, ${chalk.italic.cyan(`file`)}, or ${chalk.italic.cyan(`url`)}`)}${caret}`)
            )
            let value2
            switch (type2) {
              case 'stdin':
                value2 = await question(
                  chalk.white.bold(`Input string in stdin to store at path ${chalk.bold.green(nodepath.join(' \u2771 '))}${caret}`)
                )
                break
              case 'file':
                value2 = await question(
                  chalk.white.bold(`Input path to file to store at path ${chalk.bold.green(nodepath.join(' \u2771 '))}${caret}`)
                )
                break
              case 'url':
                value2 = await question(
                  chalk.white.bold(`Input url to store at path ${chalk.bold.white(nodepath.join(' \u2771 '))}${caret}`)
                )
                break
              default:
                console.log(chalk.red(`${type2} is not a valid option. Try again...`))
                await actionOptPrompt()
                break
            }
            return { action, type: type2, value: value2 }
          }
          let results = await actionOptPrompt()
          let { type, value } = results
          gun.locker(nodepath).put({ type, value })
          gun.locker(nodepath).value(function (value2) {
            console.log(chalk.green(`Stored at path ${nodepath.join(' \u2771 ')}`))
            console.log(value2)
          })
        }
      }
    }
  }
}
await Start()
