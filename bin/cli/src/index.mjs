'use strict'
import { question, chalk, sleep } from 'zx'
import { exists, mkdir, read } from '../lib/file-utils.mjs'
import Gun from 'gun'
import '../lib/chain-hooks/chainlocker.mjs'
import { findArg } from '../lib/arg.mjs'
import config from '../../config/index.mjs'
import { MASTER_KEYS } from '../lib/auth.mjs'
import { warn } from '../lib/debug.mjs'
import lzString from 'lz-string'
const caret = chalk.green.bold('\n\u2771 ')
export const getCID = async (vaultname2, keypair) => lzString.compressToEncodedURIComponent(await Gun.SEA.work(vaultname2, keypair))
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
        chalk.white.bold(`Enter a unique but ${chalk.bold.green(`memorable`)} salt string **(aka: password)** for a new keypair 
${chalk.yellowBright(`WARNING: If you enter the wrong password then a new, empty vault will be created.`)}${caret}`)
      )
    }
    if (salt) {
      hasSalt = true
    }
  }
  cID = await getCID(vaultname, keypair)
  if (!exists(`${config.radDir}/${cID}`)) {
    console.log(chalk.green(`Creating new vault ${vaultname} in 3 seconds...`))
    warn(
      `If you were trying to access an existing vault, you may need to exit ${chalk.white.italic(
        `[CTRL-C]`
      )} and re-enter your password.${caret}`
    )
    await sleep(3e3)
    mkdir(`${config.radDir}/${cID}`)
  }
  let gun = Gun({ file: `${config.radDir}/${cID}` })
  if (hasSalt && typeof salt === 'string') {
    keypair = await gun.keys([vaultname, salt])
  }
  let [action, ...actionOpts] = findArg('store', { dash: false, valueIsArray: true })
  let [actionf, ...actionOptsf] = findArg('fetch', { dash: false, valueIsArray: true })
  if (actionf) {
    action = 'fetch'
    if (actionOptsf) {
      actionOpts = actionOptsf
    }
  }
  if (!action) {
    action = await question(
      chalk.white.bold(`Do you want to ${chalk.bold.green(`store`)} or ${chalk.bold.green(`fetch`)} data in ${vaultname}?${caret}`),
      { choices: ['store', 'fetch'] }
    )
  }
  if (action) {
    let antwoord = await question(
      chalk.white.bold(`Input the path to desired locker (database node) 
ChainLocker paths can be separated by "/"(slash) , "."(dot) , or " "(space)${caret}`)
    )
    actionOpts = antwoord.split(/[\/\.\t\ ]/g)
  }
  if (actionOpts.length > 0) {
    let nodepath = []
    let arrItr = actionOpts
    let actionType = '--file'
    for (let i in arrItr) {
      if (arrItr[i]?.startsWith('--') || arrItr[i] === actionType) {
        continue
      }
      console.log(arrItr[i])
      if (typeof arrItr[i] == 'string') {
        nodepath.push(arrItr[i])
      }
    }
    console.log('NODEPATH', nodepath.join('/'))
    console.log(chalk.green(`${vaultname} \u2771\u2771\u2771--${nodepath.join(' \u2771 ')}--\u2771\u2771`))
    gun.vault(vaultname, { keys: keypair })
    if (action === 'fetch') {
      let locker2 = gun.locker(nodepath.join('/'))
      locker2.value((data) => {
        console.log(data)
      })
    }
    let locker = gun.locker(nodepath.join('/'))
    locker.put(
      {
        type: 'stdin',
        data: 'kjahfkjshfslkdjflksjdlfkjslkfjsdlkfjskdjflasdkjflk',
        auth: cID,
      },
      (data) => {
        if (data.err) {
          console.log(chalk.red(data.err))
        }
        console.log(data)
      }
    )
    locker.value((data) => {
      console.log('Datattatata', data)
    })
    if (action === 'store') {
      let input
      const actions = /* @__PURE__ */ new Map([
        [
          'stdin',
          async (input2) => {
            let locker2 = gun.locker(nodepath.join('/'))
            locker2.put(
              {
                type: 'stdin',
                data: input2,
                auth: cID,
              },
              (data) => {
                if (data.err) {
                  console.log(chalk.red(data.err))
                }
                console.log(data)
              }
            )
            locker2.value((data) => {
              console.log('Datattatata', data)
            })
          },
        ],
        [
          'file',
          async (input2) => {
            let locker2 = gun.locker(nodepath.join('/'))
            let _input = await read(input2, 'utf-8')
            console.log(
              chalk.green(`${input2} \u2771\u2771\u2771\u2771 
${_input}`)
            )
            locker2.put(
              {
                type: 'file',
                data: {
                  encoding: 'utf-8',
                  local_path: input2,
                  file_data: _input,
                },
                auth: cID,
              },
              (data) => {
                if (data.err) {
                  console.log(chalk.red(data.err))
                }
              }
            )
            locker2.value((data) => {
              console.log('Datattatata', data)
            })
          },
        ],
        [
          'url',
          async (input2) => {
            let locker2 = gun.locker(nodepath.join('/'))
            locker2.put(
              {
                type: 'file',
                data: input2,
                auth: cID,
              },
              (data) => {
                if (data.err) {
                  console.log(chalk.red(data.err))
                }
              }
            )
            locker2.value((data) => {
              console.log('Datattatata', data)
            })
          },
        ],
      ])
      if (!actionType || !input) {
        actionType = await question(
          chalk.white.bold(`Enter the ${chalk.bold.green(`type`)} of data you would like to store at path ${chalk.bold.green(nodepath)}
 Input ${chalk.bold.italic(
   `stdin | ${chalk.italic.cyan(`<0>`)}, file | ${chalk.italic.cyan(`<1>`)}, or url | ${chalk.italic.cyan(`<2>`)}`
 )}${caret}`),
          { choices: ['stdin', 'file', 'url'] }
        )
      }
      if (actionType) {
        input = actionType.includes('=')
          ? actionType.split('=')[1]
          : await question(
              chalk.white.bold(
                `Enter the ${chalk.bold.green(actionType.replace('--', ''))} data you would like to store at path ${chalk.bold.green(
                  nodepath
                )}${caret}`
              )
            )
        console.log(input)
      }
      if (input) {
        let run = actions.get(actionType)
        if (run) {
          await run(input)
        }
      }
    }
  }
}
process.exit(0)
