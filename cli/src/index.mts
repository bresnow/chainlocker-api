import { question, chalk, argv } from 'zx'
import { exists, mkdir, read } from '../lib/file-utils.mjs'
import Gun, { IGunInstance, ISEAPair } from 'gun'
import Help from '../lib/help.mjs'
import '../lib/chain-hooks/chainlocker.mjs'
import { findArg, findParsed as filterParsedArgs } from '../lib/arg.mjs'
import config from '../../config/index.mjs'
import { MASTER_KEYS, SysUserPair } from '../lib/auth.mjs'
import { getCID } from '../lib/chain-hooks/chainlocker.mjs'

let gun,
  hasSalt = false,
  salt = ''
let [vault, vaultname] = findArg('vault', { dash: false })
if (!vault || !vaultname) {
  vaultname = await question(chalk.white.bold(`Enter desired vault name \n  ❱  `))
}
if (vaultname && typeof vaultname === 'string') {
  let keypair = MASTER_KEYS,
    cID
  let [pair, salt] = findArg('pair', { dash: true })
  if (pair) {
    if (!salt) {
      salt = await question(
        chalk.white.bold(
          `Enter a unique but memorable salt string **[password]** for a new keypair \n${chalk.yellowBright(
            `WARNING: If you enter the wrong password then a new, empty vault will be created.`
          )}  ❱  `
        )
      )
    }
    if (salt) {
      hasSalt = true
    }
  }
  cID = await getCID(vaultname, keypair)
  if (!exists(`${config.radDir}/${cID}`)) {
    console.log(chalk.green(`Creating new vault ${vaultname}`))
    mkdir(`${config.radDir}/${cID}`)
  }
  gun = Gun({ file: `${config.radDir}/${cID}` })
  if (hasSalt && typeof salt === 'string') {
    keypair = await gun.keys([vaultname, salt])
  }
  gun.vault(
    vaultname,
    function (data) {
      console.log(data)
    },
    { keys: keypair }
  )

  let [store, ...storeopts] = findArg('store', { dash: false, valueIsArray: true })
  if (store && storeopts.length > 0) {
    let nodepath: string[] = []
    let itr = storeopts.values()
    for (let path in itr) {
      if (typeof path == 'string') {
        nodepath.push(path)
      }
    }
    let locker = gun.locker(nodepath)
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
