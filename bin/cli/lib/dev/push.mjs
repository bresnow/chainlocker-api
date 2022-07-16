#!/usr/bin/env node
'use strict'
import { $, question, chalk } from 'zx'
import { io } from 'fsxx'
import 'zx/globals'
export default async function () {
  $.verbose = false
  let pkg = await io.json`package.json`
  let message,
    version = pkg.version
  if (version === void 0) {
    version = await question(`${chalk.green('Version? \n Current Version ') + chalk.cyan(pkg.data.version)}: `)
    version === '' ? (version = pkg.data.version) : (version = version.trim())
  }
  pkg.data.version = version
  await pkg.save()
  if (message === void 0) {
    message = await question(chalk.green('Message for commit : '))
    if (message === '' || message.length < 2) {
      message = `Default Commit ${new Date(Date.now()).toLocaleString('en-US', { timeZone: 'America/New_York' }).slice(0, -3)}`
    }
  }
  await $`git status`
  try {
    await $`yarn prettier`
  } catch (error) {
    console.log(chalk.red(error))
  }
  await $`git add --all`
  await $`git commit -s -m ${`${message} | ${version}`}`
  await $`git push`
}
