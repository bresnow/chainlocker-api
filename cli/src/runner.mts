import Gun, { IGunInstance, ISEAPair } from 'gun'
import { $, chalk, question, argv } from 'zx'
import { exists } from 'fsxx'
import { SysUserPair, getImmutableMachineInfo, MASTER_KEYS } from '../lib/auth.mjs'
import { err, warn } from '../lib/debug.mjs'
import Vault from './commands/vault.mjs'
import Help from '../lib/help.mjs'
import MappedCase from './commands/map-case.mjs'
// import '../lib/chain-hooks/chainlocker.mjs'
import Push from '../lib/dev/push.mjs'
import Build from '../lib/dev/build.mjs'
import lzStr from 'lz-string'
// import 'gun/lib/path.js'
// import 'gun/lib/load.js'
// import 'gun/lib/open.js'
// import 'gun/lib/then.js'
import Store from './commands/store.mjs'
import config from '../../config/index.mjs'
import Pair from '../lib/encryption/pair.mjs'
const SEA = Gun.SEA

//   let worked = (await SEA.work(vault, MASTER_KEYS)) as string
//   let secureVault = lzStr.compressToUTF16(worked)
//   let $LOCKER_PATH = config.lockerDirectory + '/' + secureVault
//   let gun: IGunInstance<any>

//   try {
//     if (!exists($LOCKER_PATH)) {
//       console.log(chalk.white.italic(`New vault setup. Creating ${vault}`))
//       await $`mkdir -p ${$LOCKER_PATH}`
//     } else {
//       console.log(chalk.white.italic(`Opening ${vault}`))
//     }

//   } catch (error) {
//     err(error as string)
//   }
// gun = new Gun({ file: `${$LOCKER_PATH}` })

// gun.vault(vault)
//   let chainlockerOpts = MappedCase(vault, gun)
//   let cmd = await question(chalk.white(`Current Node ❱ ${chalk.red.bold('>>')}${path ?? 'root'}${chalk.red.bold('-->>')}  `))
//   if (cmd) {
//     cmd = cmd.trim()
//     if (cmd) {
//       let runner = cmd.split(' ').map((x) => x.trim().toLocaleLowerCase())
//       let [command, opt, ...args] = runner
//       // console.log(command, opt, args, '\n', runner)

//       if (chainlockerOpts.has(opt)) {
//         let run = chainlockerOpts.get(opt)
//         if (run) {
//           await run(args)
//         }
//       } else {
//         err(`${opt} is not a valid command.`)
//         Help('chainlocker')
//       }
//     }
//     if (command === ('exit' || 'quit')) {
//       let confirm = await question(chalk.white(`Are you sure you want to exit? (y/N)`))
//       if (confirm === 'y' && opt !== '--force') {
//         console.log(chalk.white.italic(`Pushing to github before exit...`))
//         await Push()
//         process.exit(0)
//       }
//       if (confirm === 'y' && opt === '--force') {
//         process.exit(0)
//       }
//       warn('Aborting exit.')
//       await Run()
//     }
//   }
// }
