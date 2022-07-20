'use strict'
import Gun from 'gun'
import 'gun/lib/path.js'
import chokidar from 'chokidar'
import { glob, chalk } from 'zx'
import { read, exists } from '../file-utils.mjs'
import os from 'os'
Gun.chain.scope = async function (what, options) {
  options = options ?? {
    verbose: true,
    alias: os.userInfo().username,
  }
  let _gun = this
  _gun.opt({ file: 'scope_dev' })
  let modifiedPath = options.alias
  let matches = await glob([...what], { gitignore: true })
  try {
    let scope = chokidar.watch(matches, { persistent: true })
    const log = console.log
    scope
      .on('add', async function (path, stats) {
        if (!exists(path)) {
          options.verbose && log(chalk.red(`File ${path} does not exist`))
          return
        }
        if (!stats?.isFile()) {
          options.verbose && log(chalk.red(`File ${path} is not a file`))
          return
        }
        let nodepath = path.split('/')
        let name = nodepath.at(nodepath.length - 1)
        nodepath.pop() && nodepath.pop()
        if (nodepath && name) {
          _gun
            .get(options.alias)
            .path(nodepath)
            .put({ [name]: await read(path) })
          options.verbose && log(chalk.green(`File ${path} has been added`))
        } else {
          log(chalk.red(`Error adding file ${path}`))
          return
        }
      })
      .on('change', async function (path, stats) {
        if (!exists(path)) {
          options.verbose && log(chalk.red(`File ${path} does not exist`))
          return
        }
        if (!stats?.isFile()) {
          options.verbose && log(chalk.red(`File ${path} is not a file`))
          return
        }
        let nodepath = path.split('/')
        let name = nodepath.at(nodepath.length - 1)
        nodepath.pop() && nodepath.pop()
        if (nodepath && name) {
          _gun
            .get(options.alias)
            .path(nodepath)
            .put({ [name]: await read(path) })
          options.verbose && log(chalk.green(`File ${path} has been changed`))
        } else {
          log(chalk.red(`Error onChange for ${path}`))
          return
        }
      })
      .on('unlink', async function (path) {
        if (!exists(path)) {
          options.verbose && log(chalk.red(`File ${path} does not exist`))
          return
        }
        let nodepath = path.split('/')
        let name = nodepath.at(nodepath.length - 1)
        nodepath.pop() && nodepath.pop()
        if (nodepath && name) {
          _gun
            .get(options.alias)
            .path([...nodepath, name])
            .put(null)
          options.verbose && log(chalk.green(`File ${path} has been removed`))
        } else {
          log(chalk.red(`Error deleting file ${path}`))
          return
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
    console.log(chalk.red('If you want to use the scope feature, you must install `chokidar` by typing `npm i chokidar` in your terminal.'))
  }
}
