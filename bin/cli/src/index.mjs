'use strict'
import { question, chalk, argv } from 'zx'
import Gun from 'gun'
let { _ } = argv
const gun = Gun()
const cmdMap = /* @__PURE__ */ new Map([
  [
    'vault',
    async function (args2 = []) {
      let opt = args2[1]
      let { name } = argv
      switch (opt) {
        case 'create':
          if (!name) {
            let answer = await question(
              chalk.white.bold(`Enter name of vault to create: 
  \u2771 `)
            )
            console.log(answer)
          }
          break
        default:
          break
      }
    },
  ],
])
let args = process.argv.slice(2)
console.log(args)
if (cmdMap.has(args[0])) {
  let run = cmdMap.get(args[0])
  let map = _.map((x) => x.toString())
  run && (await run(map))
}
