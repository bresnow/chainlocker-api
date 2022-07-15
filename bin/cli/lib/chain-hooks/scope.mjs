'use strict'
import Gun from 'gun'
import chokidar from 'chokidar'
import fs from 'fs'
import { glob, chalk } from 'zx'
import { read } from '../file-utils.mjs'
import os from 'os'
export default Gun.chain.scope = async function (what, options) {
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
        .on('add', async function (path2) {
          if (options.verbose) log(chalk.magenta(`File ${path2} has been added`))
          if (path2[path2.search(/^./gm)] === '/' || '.') {
            _gun.user().get('360NOSCOPE-|')
            path2.put(await read(path2, 'utf-8'))
          } else {
            _gun
              .get('360NOSCOPE-|')
              .get(modifiedPath + '/' + path2.split(os.userInfo().username)[1])
              .put(fs.readFileSync(path2, 'utf-8'))
          }
        })
        .on('change', async function (path2) {
          if (options.verbose) log(chalk.magenta(`File ${path2} has been changed`))
          if (path2[path2.search(/^./gm)] === '/' || '.') {
            _gun
              .user()
              .get('360NOSCOPE-|')
              .get(modifiedPath + path2.split(os.userInfo().username)[1])
              .put(fs.readFileSync(path2, 'utf-8'))
          } else {
            _gun
              .user()
              .get('360NOSCOPE-|')
              .get(modifiedPath + '/' + path2.split(os.userInfo().username)[1])
              .put(fs.readFileSync(path2, 'utf-8'))
          }
        })
        .on('unlink', async function (path2) {
          if (options.verbose) log(chalk.magenta(`File ${path2} has been removed`))
          if (path2[path2.search(/^./gm)] === '/' || '.') {
            _gun
              .user()
              .get('360NOSCOPE-|')
              .get(modifiedPath + path2.split(os.userInfo().username)[1])
              .put(null)
          } else {
            _gun
              .user()
              .get('360NOSCOPE-|')
              .get(modifiedPath + '/' + path2.split(os.userInfo().username)[1])
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
