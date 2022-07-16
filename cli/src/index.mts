import { question, chalk, argv } from 'zx'
import { read } from '../lib/file-utils.mjs'
import Gun from 'gun'
import Help from '../lib/help.mjs'

let { _ } = argv
let args = process.argv.slice(2)
export const findArg = (argValue: string, slice = 2, opts?: { dash: false }) =>
  process.argv.slice(slice)[1] === (opts?.dash ? '--' : '') + argValue.toLowerCase().trim()
    ? [process.argv.slice(slice)[0], process.argv.slice(slice)[1]]
    : [null, null]
const gun = Gun()
const cmdMap = new Map([
  [
    'vault',
    async function (args: string[] = []) {
      let opt = args[1]
      let [name, nameval] = findArg('name')
      let [keys, seapair] = findArg('keys')
      switch (opt) {
        case 'create':
          if (!name) {
            let answer = await question(chalk.white.bold(`Enter name of vault to create: \n  ❱ `))
            console.log(answer)
            nameval = answer
          }
          if (nameval) {
            gun.vault(nameval)
          }

          break

        default:
          break
      }
    },
  ],
])

console.log(args)
if (cmdMap.has(args[0])) {
  let run = cmdMap.get(args[0])
  let map = _.map((x) => x.toString())
  run && (await run(map))
}
// cmdMap.set('help', async function (_args: string[] = []) {
//     Help('chainlocker')
// }
// )
// let i=0, l=_.length
// for (i; i<l; i++) {
//     let cmd = _[i]

// }
// }
