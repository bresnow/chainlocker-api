#!/usr/bin/env node
import { question, chalk, $, sleep } from 'zx'
import { exists } from '../lib/file-utils.mjs'
import Gun, { ISEAPair } from 'gun'
import '../lib/chain-hooks/chainlocker.mjs'
import { findArg } from '../lib/arg.mjs'
import config from '../../config/index.mjs'
import { MASTER_KEYS } from '../lib/auth.mjs'

import { err } from '../lib/debug.mjs'
import lzString from 'lz-string'
const caret = chalk.green.bold('\n❱ ')
let gun = Gun()
console.clear()
/**
 * Generates a Proof Od Work hash compressed into a url-safe URI string. Can use output as directory name or url paths without unsafe characters.
 * @param vaultname
 * @param keypair
 * @returns EncodedURIString
 */
export const getCID = async (vaultname: string, keypair: ISEAPair) =>
  lzString.compressToEncodedURIComponent((await Gun.SEA.work(vaultname, keypair)) as string)
export const isDashedOption = (option: string) => option.startsWith('-')
export default async function Start(): Promise<void> {
  console.log(`${caret}${chalk.blue.bold('Welcome to the ChainLocker CLI')}${caret}`)
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
        chalk.yellowBright(
          `If you were trying to access an existing vault, you may need to exit ${chalk.white.italic(
            `[CTRL-C]`
          )} and re-enter your password.${caret}`
        )
      )
      await sleep(3000)
      try {
        await $`mkdir -p ${config.radDir}/${cID}`
      } catch (error) {
        err(error)
      }
    }
    gun = Gun({ file: `${config.radDir}/${cID}` })
    //vault context returns an authenticated Gun user instance
    let vault = gun.vault(
      vaultname,
      (_ack) => {
        console.log(chalk.green(`Vault ${vaultname} Authorized. \n public-key: ${keypair.pub} \n pubic-encryption-key: ${keypair.epub}`))
      },
      { keys: keypair }
    )

    // vault.on('in', (msg) => {
    //   console.log(chalk.green(`Vault ${vaultname} In Message.`))
    //   console.log(JSON.stringify(msg['#'], null, 2))
    // })
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
          `Input the path to desired locker (database node) \nChainLocker node paths can be separated by " " ${chalk.bold.green(
            `< space >`
          )}, or "\\t" ${chalk.bold.green(`< tab >`)}${caret}`
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

      if (actionopts.length < 1) {
        if (action === 'store') {
          async function actionOptPrompt() {
            let type = await question(
              chalk.white.bold(
                `Enter the ${chalk.bold.green(`type`)} of data you would like to store at path ${chalk.bold.green(
                  nodepath
                )}\n Input ${chalk.bold.italic(
                  `${chalk.italic.cyan(`stdin`)}, ${chalk.italic.cyan(`file`)}, or ${chalk.italic.cyan(`url`)}`
                )}${caret}`
              )
            )
            let value
            switch (type) {
              case 'stdin':
                value = await question(
                  chalk.white.bold(`Input string in stdin to store at path ${chalk.bold.green(nodepath.join(' ❱ '))}${caret}`)
                )
                break
              case 'file':
                value = await question(
                  chalk.white.bold(`Input path to file to store at path ${chalk.bold.green(nodepath.join(' ❱ '))}${caret}`)
                )
                break
              case 'url':
                value = await question(chalk.white.bold(`Input url to store at path ${chalk.bold.white(nodepath.join(' ❱ '))}${caret}`))
                break
              default:
                console.log(chalk.red(`${type} is not a valid option. Try again...`))
                await actionOptPrompt()
                break
            }

            return { action, type, value }
          }

          let results = await actionOptPrompt()
          // console.log('OPT\n   ', results)
          let { type, value } = results
          gun.locker(nodepath).put({ type, value })
          gun.locker(nodepath).value(function (value) {
            console.log(chalk.green(`Stored at path ${nodepath.join(' ❱ ')}`))
            console.log(value)
          })
        }
        // process.exit(0)
      }
      //
      //         if (!_value) {
      //           if (option === 'stdin') {
      //             _value =
      //           }
      //           if (option === 'file') {

      //           }
      //           if (option === 'url') {
      //             _value = await question(chalk.white.bold(`Input url to store at path ${chalk.bold.green(nodepath.join(' ❱'))}${caret}`))
      //           }
      //         }
      //         actionopts.push([option, _value])

      //   }
      // }

      // console.log(actionopts)

      // if (actionopts.length >= 1) {
      //   let path = nodepath.join('/')
      //   console.log(nodepath, 'nodepath')
      //   let locker = gun.locker(path)
      //   for (const [option, value] of actionopts) {

      //     if (option === 'stdin') {
      //       locker.put({ data: value }, (ack) => {
      //         console.log(ack)
      //       })
      //       locker.value((data) => {
      //         console.log(data)
      //       })
      //     }
      //     if (option === 'file') {
      //       let file = await read(value)
      //       locker.put({ data: file }, (ack) => {
      //         console.log(ack)
      //       })
      //     }
      //     if (option === 'url') {
      //       let url = await fetch(value)
      //       locker.put({ data: url }, (ack) => {
      //         console.log(ack)
      //       })
      //     }
      //   }
    }
  }
}
await Start()
//cleanup the nodepath

//node path interface confirmation
// console.log(chalk.green(`${vaultname} ❱❱❱--${nodepath.join('❱')}--❱❱`))
// }
// locker context
// let locker = gun.locker(nodepath)
// if (action === 'fetch') {
//   locker.value((data) => {
//     console.log(data)
//   })
// }

// if (action === 'store') {
//   let input

//   let run = actions.get()
//   if (run) {
//     await run(input)
//   }

// }

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
// }
