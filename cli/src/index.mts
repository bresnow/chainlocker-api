import { question, chalk, argv, sleep } from 'zx'
import { exists, mkdir, read } from '../lib/file-utils.mjs'
import Gun, { ISEAPair } from 'gun'
import Help from '../lib/help.mjs'
import fs from 'fs-extra'
import '../lib/chain-hooks/chainlocker.mjs'
import { findArg, findParsed as filterParsedArgs, findParsed } from '../lib/arg.mjs'
import config from '../../config/index.mjs'
import { MASTER_KEYS } from '../lib/auth.mjs'

import { warn } from '../lib/debug.mjs'
import lzString from 'lz-string'
const caret = chalk.green.bold('\n❱ ')
let gun = Gun()
/**
 * Generates a Proof Od Work hash compressed into a url-safe URI string. Can use output as directory name or url paths without unsafe characters.
 * @param vaultname
 * @param keypair
 * @returns EncodedURIString
 */
export const getCID = async (vaultname: string, keypair: ISEAPair) =>
  lzString.compressToEncodedURIComponent((await Gun.SEA.work(vaultname, keypair)) as string)
export const isDashedOption = (option: string) => option.startsWith('-')

let hasSalt = false
//argument finder
let [vault, vaultname] = findArg('vault', { dash: false })
if (!vault) {
  vaultname = await question(chalk.white.bold(`Enter desired vault name${caret}`))
}
if (vaultname && typeof vaultname === 'string') {
  let keypair = MASTER_KEYS,
    cID: string
  let [pair, salt] = findArg('pair', { dash: true })
  if (pair) {
    if (!salt) {
      salt = await question(
        chalk.white.bold(
          `Enter a unique but ${chalk.bold.green(`memorable`)} string as a passphrase/salt for a new keypair \n${chalk.yellowBright(
            `WARNING: If you enter the wrong password then a new, empty vault will be created.`
          )}${caret}`
        )
      )
    }
    if (salt) {
      hasSalt = true
    }
  }
  if (hasSalt && typeof salt === 'string') {
    // salt is split into an array of strings separated by tabs and spaces
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
    await sleep(3000)
    mkdir(`${config.radDir}/${cID}`)
  }
  gun = Gun({ file: `${config.radDir}/${cID}` })
  //vault context returns an authenticated Gun user instance
  let user = gun.vault(vaultname, { keys: keypair })

  user.get(`chainlocker`).once((data) => {
    if (data) {
      if (data.vault && data.vault_id !== cID) {
        //check POW hashes to make sure they match
        throw new Error(`Err authenticating ${vaultname}`)
      }
    }
    if (!data) {
      // vault data for when peered with another locker or Gun graph
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
      if (action !== ('store' || 'fetch')) {
        console.log(chalk.red(`${action} is not a valid option. Try again...`))
        await storeFetchPrompt()
      }
      return action
    }

    action = await storeFetchPrompt()
  }
  if (action) {
    let antwoord = await question(
      chalk.white.bold(
        `Input the path to desired locker (database node) \nChainLocker node paths can be separated by " "${chalk.bold.green(
          `< space >`
        )}, or "\\t"${chalk.bold.green(`< tab >`)}${caret}`
      )
    )
    actioncmds = antwoord.split(/[\t\ ]/g)
  }
  if (actioncmds.length > 0) {
    let nodepath: string[] = []
    let arrItr = actioncmds
    let actionopts: [string, string][] = []
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

    if (action === 'store' && actionopts.length < 1) {
      let opt = await question(
        chalk.white.bold(
          `Enter the ${chalk.bold.green(`type`)} of data you would like to store at path ${chalk.bold.green(
            nodepath
          )}\n Input ${chalk.bold.italic(
            `${chalk.italic.cyan(`--stdin`)}, ${chalk.italic.cyan(`--file`)}, or ${chalk.italic.cyan(`--url`)}`
          )}${caret}`
        ),
        { choices: ['--stdin', '--file', '--url'] }
      )

      let arr = opt.split(/[\t\ ]/g)
      let iterator = arr.values()
      for (const val of iterator) {
        if (val) {
          if (isDashedOption(val)) {
            let option = val.replace(/-/g, '').trim()
            let _value = iterator.next().value
            if (!_value) {
              if (option === 'stdin') {
                _value = await question(
                  chalk.white.bold(`Input string in stdin to store at path ${chalk.bold.green(nodepath.join(' ❱'))}${caret}`)
                )
              }
              if (option === 'file') {
                _value = await question(
                  chalk.white.bold(`Input path to file to store at path ${chalk.bold.green(nodepath.join(' ❱'))}${caret}`)
                )
              }
              if (option === 'url') {
                _value = await question(chalk.white.bold(`Input url to store at path ${chalk.bold.green(nodepath.join(' ❱'))}${caret}`))
              }
            }
            actionopts.push([option, _value])
          }
        }
      }
    }

    console.log(nodepath, actionopts)
    //cleanup the nodepath
    nodepath = nodepath.map((path) => path.trim())
    //node path interface confirmation
    console.log(chalk.green(`${vaultname} ❱❱❱--${nodepath.join('❱')}--❱❱`))
  }
  // locker context
  // let locker = gun.locker(nodepath)
  // if (action === 'fetch') {
  //   locker.value((data) => {
  //     console.log(data)
  //   })
  // }

  // if (action === 'store') {
  //   let input
  //   const actions = new Map([
  //     [
  //       'stdin',
  //       async (input: string) => {
  //         let locker = gun.locker(nodepath.join('/'))
  //         locker.put(
  //           {
  //             type: 'stdin',
  //             data: input,
  //             auth: cID,
  //           },
  //           (data) => {
  //             if (data.err) {
  //               console.log(chalk.red(data.err))
  //             }
  //             console.log(data)
  //           }
  //         )
  //         locker.value((data) => {
  //           console.log('Datattatata', data)
  //         })
  //       },
  //     ],
  //     [
  //       'file',
  //       async (input: string) => {
  //         let locker = gun.locker(nodepath.join('/'))
  //         let _input = await read(input, 'utf-8')
  //         console.log(chalk.green(`${input} ❱❱❱❱ \n${_input}`))
  //         locker.put(
  //           {
  //             type: 'file',
  //             data: {
  //               encoding: 'utf-8',
  //               local_path: input,
  //               file_data: _input,
  //             },
  //             auth: cID,
  //           },
  //           (data) => {
  //             if (data.err) {
  //               console.log(chalk.red(data.err))
  //             }
  //           }
  //         )
  //         locker.value((data) => {
  //           console.log('Datattatata', data)
  //         })
  //       },
  //     ],
  //     [
  //       'url',
  //       async (input: string) => {
  //         let locker = gun.locker(nodepath.join('/'))
  //         locker.put(
  //           {
  //             type: 'file',
  //             data: input,
  //             auth: cID,
  //           },
  //           (data) => {
  //             if (data.err) {
  //               console.log(chalk.red(data.err))
  //             }
  //           }
  //         )
  //         locker.value((data) => {
  //           console.log('Datattatata', data)
  //         })
  //       },
  //     ],
  //   ])

  //   let run = actions.get()
  //   if (run) {
  //     await run(input)
  //   }

  // }

  process.exit(0)
  //     = await question(chalk.white.bold(`Build a node path for ${nameval}? \n Type yes or no ❱ `), { choices: ['yes', 'no'] })
  // if (answer === 'yes') {
  //     let nodepath = await question(chalk.white.bold(`Enter desired path to ${nameval} \n  ❱`))
  //     let lock = gun.locker(nodepath)
  //     lock.value(async (data) => {
  //         if (!data.err && data) {
  //             console.log('LOCKER VALUE\n ', data)
  //         }
  //     })

  // }

  //         },
  //     ],
  // ])

  //     if (cmdMap.has(args[0])) {
  //         let run = cmdMap.get(args[0])
  //         let map = _.map((x) => x.toString())
  //         run && (await run(map, gun))
  //     }

  // console.log(args)
  // cmdMap.set('help', async function (_args: string[] = []) {
  //     Help('chainlocker')
  // }
  // )
  // let i=0, l=_.length
  // for (i; i<l; i++) {
  //     let cmd = _[i]

  // }
}
