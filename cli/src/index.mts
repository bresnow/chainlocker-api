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

export const getCID = async (vaultname: string, keypair: ISEAPair) =>
  lzString.compressToEncodedURIComponent((await Gun.SEA.work(vaultname, keypair)) as string)
let hasSalt = false
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
          `Enter a unique but ${chalk.bold.green(`memorable`)} salt string **(aka: password)** for a new keypair \n${chalk.yellowBright(
            `WARNING: If you enter the wrong password then a new, empty vault will be created.`
          )}${caret}`
        )
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
    await sleep(3000)
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
      chalk.white.bold(
        `Input the path to desired locker (database node) \nChainLocker paths can be separated by "/"(slash) , "."(dot) , or " "(space)${caret}`
      )
    )

    actionOpts = antwoord.split(/[\/\.\t\ ]/g)
  }
  if (actionOpts.length > 0) {
    let nodepath: string[] = []
    let arrItr = actionOpts

    let actionType = '--file' || '--stdin' || '--url'

    for (let i in arrItr) {
      if (arrItr[i]?.startsWith('--') || arrItr[i] === actionType) {
        continue
      }
      console.log(arrItr[i])
      if (typeof arrItr[i] == 'string') {
        nodepath.push(arrItr[i] as string)
      }
    }
    console.log('NODEPATH', nodepath.join('/'))
    console.log(chalk.green(`${vaultname} ❱❱❱--${nodepath.join(' ❱ ')}--❱❱`))
    // let lock = gun.locker('test/a/rooonie')
    // lock.put({ test: 'ICKLE' }, (data) => {
    //   if (data.err) {
    //     console.log(data.err)
    //   }
    // })
    // lock.value((data) => {
    //   console.log(data)
    // })

    gun.vault(vaultname, { keys: keypair })
    if (action === 'fetch') {
      let locker = gun.locker(nodepath.join('/'))
      locker.value((data) => {
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
      const actions = new Map([
        [
          'stdin',
          async (input: string) => {
            let locker = gun.locker(nodepath.join('/'))
            locker.put(
              {
                type: 'stdin',
                data: input,
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
          },
        ],
        [
          'file',
          async (input: string) => {
            let locker = gun.locker(nodepath.join('/'))
            let _input = await read(input, 'utf-8')
            console.log(chalk.green(`${input} ❱❱❱❱ \n${_input}`))
            locker.put(
              {
                type: 'file',
                data: {
                  encoding: 'utf-8',
                  local_path: input,
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
            locker.value((data) => {
              console.log('Datattatata', data)
            })
          },
        ],
        [
          'url',
          async (input: string) => {
            let locker = gun.locker(nodepath.join('/'))
            locker.put(
              {
                type: 'file',
                data: input,
                auth: cID,
              },
              (data) => {
                if (data.err) {
                  console.log(chalk.red(data.err))
                }
              }
            )
            locker.value((data) => {
              console.log('Datattatata', data)
            })
          },
        ],
      ])
      if (!actionType || !input) {
        actionType = await question(
          chalk.white.bold(
            `Enter the ${chalk.bold.green(`type`)} of data you would like to store at path ${chalk.bold.green(
              nodepath
            )}\n Input ${chalk.bold.italic(
              `stdin | ${chalk.italic.cyan(`<0>`)}, file | ${chalk.italic.cyan(`<1>`)}, or url | ${chalk.italic.cyan(`<2>`)}`
            )}${caret}`
          ),
          { choices: ['stdin' || '0', 'file' || '1', 'url' || '2'] }
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
        let run = actions.get(actionType.trim())
        if (run) {
          await run(input)
        }
      }
    }
  }
}

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
// }
