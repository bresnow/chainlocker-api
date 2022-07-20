import Gun, { IGunInstance } from 'gun'
import 'gun/lib/path.js'
import chokidar from 'chokidar'
import fs from 'fs'
import { glob, chalk } from 'zx'
import fsUtil, { read, write, exists } from '../file-utils.mjs'
import os from 'os'

/**
 * Scope watches the files in a directory and stores them in rad. No separate .ignore files as it uses the .gitignore file already in your current directory.
 * @param {string[]}what Glob pattern to watch
 * @param {callback(event, path, stats):void}callback Callback function to fire when a file or directory is added, changed, or removed
 * A fork of the HUB library... https://gun.eco/docs/hub.js#options
 * TODO: Broadcast files via relay server
 * TODO: ChainLocker
 */
let { username } = os.userInfo()
Gun.chain.scope = async function (what, callback, { verbose = true, alias = username }) {
  let _gun = this
  let matches = await glob(what, { gitignore: true })

  try {
    let scope = chokidar.watch(matches, { persistent: true })
    const log = console.log
    scope.on('all', (event, path, stats) => {
      let fileOpts = { path, matches, stats }
      if (callback) {
        callback(event, fileOpts)
        if (verbose) {
          log(chalk.green(`scope callback fired : ${event} ${path}`))
        }
      }
    })
    scope
      .on('add', async function (path, stats) {
        if (!exists(path)) {
          verbose && log(chalk.red(`File ${path} does not exist`))
          return
        }
        if (!stats?.isFile()) {
          verbose && log(chalk.red(`File ${path} is not a file`))
          return
        }
        let nodepath = path.includes('/') ? path.split('/') : [path]
        let name = nodepath.length > 1 ? nodepath.at(nodepath.length - 1) : nodepath[0]
        nodepath.pop() && nodepath.pop()
        if (nodepath && name) {
          _gun
            .get(alias)
            .path(nodepath)
            .put({ [name]: await read(path) })
          verbose && log(chalk.green(`File ${path} has been added`))
        } else {
          log(chalk.red(`Error adding file ${path}`))
          return
        }
      })
      .on('change', async function (path, stats) {
        if (!exists(path)) {
          verbose && log(chalk.red(`File ${path} does not exist`))
          return
        }
        if (!stats?.isFile()) {
          verbose && log(chalk.red(`File ${path} is not a file`))
          return
        }
        let nodepath = path.includes('/') ? path.split('/') : [path]
        let name = nodepath.length > 1 ? nodepath.at(nodepath.length - 1) : nodepath[0]
        nodepath.pop() && nodepath.pop()
        if (nodepath && name) {
          _gun
            .get(alias)
            .path(nodepath)
            .put({ [name]: await read(path) })
          verbose && log(chalk.green(`File ${path} has been changed`))
        } else {
          log(chalk.red(`Error onChange for ${path}`))
          return
        }
      })
      .on('unlink', async function (path) {
        if (!exists(path)) {
          verbose && log(chalk.red(`File ${path} does not exist`))
          return
        }
        let nodepath = path.includes('/') ? path.split('/') : [path]
        let name = nodepath.length > 1 ? nodepath.at(nodepath.length - 1) : nodepath[0]
        nodepath.pop() && nodepath.pop()
        if (nodepath && name) {
          _gun
            .get(alias)
            .path([...nodepath, name])
            .put(null as any)
          verbose && log(chalk.green(`File ${path} has been removed`))
        } else {
          log(chalk.red(`Error deleting file ${path}`))
          return
        }
      })
    if (verbose) {
      scope
        ?.on('addDir', (path) => log(chalk.magenta(`Directory ${path} has been added`)))
        .on('unlinkDir', (path) => log(chalk.magenta(`Directory ${path} has been removed`)))
        .on('error', (error) => log(chalk.magenta(`Watcher error: ${error}`)))
        .on('ready', () => log(chalk.magenta('Initial scan complete. Ready for changes')))
    }
  } catch (err) {
    console.log(chalk.red('If you want to use the scope feature, you must install `chokidar` by typing `npm i chokidar` in your terminal.'))
  }
}
