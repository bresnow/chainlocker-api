'use strict'
import Help from '../../lib/help.mjs'
import Push from '../../lib/dev/push.mjs'
import Build from '../../lib/dev/build.mjs'
import Vault from './vault.mjs'
import Store from './store.mjs'
import { err } from '../../lib/debug.mjs'
export default (vault, gun) =>
  /* @__PURE__ */ new Map([
    [
      'help',
      async function (_args = []) {
        Help('chainlocker')
      },
    ],
    [
      'vault',
      async function (args = []) {
        await Vault(args, vault, gun)
      },
    ],
    [
      'store',
      async function (args = []) {
        await Store(args, vault, gun)
      },
    ],
    [
      'dev',
      async function (args = []) {
        let [key, value, ...flags] = args
        if (key === 'push') {
          console.log(chalk.white.italic(`Pushing to github...`))
          try {
            await Build()
            await Push()
          } catch (error) {
            err(error)
          }
        }
        if (key === 'build') {
          console.log(chalk.white.italic(`Building...`))
          await Build()
        }
      },
    ],
  ])
