import { question, chalk, argv } from 'zx'
import { exists, mkdir, read } from '../lib/file-utils.mjs'
import Gun, { IGunInstance, ISEAPair } from 'gun'
import Help from '../lib/help.mjs'
import '../lib/chain-hooks/chainlocker.mjs'
import { findArg, findParsed as filterParsedArgs } from '../lib/arg.mjs'
import config from '../../config/index.mjs'
import { MASTER_KEYS, SysUserPair } from '../lib/auth.mjs'
import lzString from 'lz-string'
export const getCID = async (vaultname: string, keypair: ISEAPair) =>
  lzString.compressToEncodedURIComponent((await Gun.SEA.work(vaultname, keypair)) as string)
let gun = Gun()
let [vault, vaultname] = findArg('vault', { dash: false })
if (!vault || !vaultname) {
  vaultname = await question(chalk.white.bold(`Enter desired vault name \n  ❱  `))
}
if (vaultname) {
  let keypair = MASTER_KEYS,
    cID
  let [pair, salt] = findArg('pair', { dash: true })
  if (pair) {
    if (!salt) {
      salt = await question(chalk.white.bold(`Enter a unique but memorable salt string for a new keypair \n  ❱  `))
    }
    if (salt) {
      keypair = await gun.keys(salt)
      console.log(keypair)
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
}

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
