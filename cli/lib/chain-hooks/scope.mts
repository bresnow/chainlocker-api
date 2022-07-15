//@ts-nocheck
import Gun from 'gun'

import chokidar from 'chokidar'
import fs from 'fs'
import { glob, chalk } from 'zx'
import fsUtil, { read, write, exists } from '../file-utils.mjs'
import os from 'os'

/**
 * 360NoScope - Secure File Watcher That Cant Be Watched.
 * Scope watches the files in a directory and stores them in a secure ChainLocker Vault. No separate .ignore files as it uses the .gitignore file already in your current directory.
 * @param {string[]}what Glob pattern to watch
 * A fork of the HUB library... https://gun.eco/docs/hub.js#options
 * TODO: Broadcast files via relay server
 * TODO: Broadcast files via relay server
 */
export default Gun.chain.scope = async function (what: string | string[], options: { verbose: true; alias: string; peers: string[] }) {
  options = options ?? {
    verbose: true,
    alias: os.userInfo().username,
  }
  let _gun = this
  _gun.back(`opt.file`)
  let modifiedPath = options.alias
  let matches = await glob([...what], { gitignore: true })

  try {
    let scope = chokidar.watch(matches, { persistent: true })
    const log = console.log
    _gun.watch = (path) =>
      scope
        .on('add', async function (path) {
          if (options.verbose) log(chalk.magenta(`File ${path} has been added`))

          if (path[path.search(/^./gm)] === '/' || '.') {
            _gun.user().get('360NOSCOPE-|')
            path.put(await read(path, 'utf-8'))
          } else {
            _gun
              .get('360NOSCOPE-|')
              .get(modifiedPath + '/' + path.split(os.userInfo().username)[1])
              .put(fs.readFileSync(path, 'utf-8'))
          }
        })
        .on('change', async function (path) {
          if (options.verbose) log(chalk.magenta(`File ${path} has been changed`))
          if (path[path.search(/^./gm)] === '/' || '.') {
            _gun
              .user()
              .get('360NOSCOPE-|')
              .get(modifiedPath + path.split(os.userInfo().username)[1])
              .put(fs.readFileSync(path, 'utf-8'))
          } else {
            _gun
              .user()
              .get('360NOSCOPE-|')
              .get(modifiedPath + '/' + path.split(os.userInfo().username)[1])
              .put(fs.readFileSync(path, 'utf-8'))
          }
        })
        .on('unlink', async function (path) {
          if (options.verbose) log(chalk.magenta(`File ${path} has been removed`))
          if (path[path.search(/^./gm)] === '/' || '.') {
            _gun
              .user()
              .get('360NOSCOPE-|')
              .get(modifiedPath + path.split(os.userInfo().username)[1])
              .put(null)
          } else {
            _gun
              .user()
              .get('360NOSCOPE-|')
              .get(modifiedPath + '/' + path.split(os.userInfo().username)[1])
              .put(null)
          }
        })
    if (options.verbose) {
      scope
        ?.on('addDir', (path) => log(chalk.magenta(`Directory ${path} has been added`)))
        .on('unlinkDir', (path) => log(chalk.magenta(`Directory ${path} has been removed`)))
        .on('error', (error) => log(chalk.magenta(`Watcher error: ${error}`)))
        .on('ready', () => log(chalk.magenta('Initial scan complete. Ready for changes')))
    }
  } catch (err) {
    console.log(
      chalk.magenta('If you want to use the NO-SCOPE-360 feature, you must install `chokidar` by typing `npm i chokidar` in your terminal.')
    )
  }
}
