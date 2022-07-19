import { question, chalk, argv } from 'zx'
import { exists, mkdir, read } from '../lib/file-utils.mjs'
import Gun, { IGunInstance, ISEAPair } from 'gun'
import Help from '../lib/help.mjs'
import '../lib/chain-hooks/chainlocker.mjs'
import { findArg, findParsed as filterParsedArgs, findParsed } from '../lib/arg.mjs'
import config from '../../config/index.mjs'
import { MASTER_KEYS, SysUserPair } from '../lib/auth.mjs'
import { getCID } from '../lib/chain-hooks/chainlocker.mjs'

let gun,
  hasSalt = false
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
          `Enter a unique but ${chalk.bold.green(`memorable`)} salt string **(aka: password)** for a new keypair \n${chalk.yellowBright(
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
  if (!store || !storeopts) {
    let antwoord = await question(
      chalk.white.bold(
        `Input the path to desired locker (aka: database node) \nNode paths can be separated by "/"(slash) OR " "(space)  ❱  `
      )
    )
    storeopts = antwoord.split('/' || ' ')
    store = 'store'
  }
  if (store && storeopts.length > 0) {
    let input
    let nodepath: string[] = []
    let itr = storeopts.values()
    let [data, put] = findParsed(storeopts, { dash: true, find: 'stdin' || 'file' || 'url' })
    for (let path in itr) {
      if (typeof path == 'string' && !path.includes('-' || '--' || data || put)) {
        nodepath.push(path)
      }
    }
    if (!data || !input)
      [
        (data = await question(
          chalk.white.bold(
            `Enter the ${chalk.bold.green(`type`)} of data you would like to store at path ${chalk.bold.green(
              nodepath
            )}\n Input ${chalk.bold.italic(`stdin ${chalk.italic.cyan(`or`)}, file, or url`)} ❱  `
          ),
          { choices: ['stdin' || 0, 'file' || 1, 'url' || 2] }
        )),
      ]
    if (data) {
      input = data.split('=')[1] ?? put
      console.log(input)
    }
    console.log(chalk.green(`Creating new locker ${nodepath.join('/')}`))
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
