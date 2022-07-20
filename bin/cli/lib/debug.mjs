'use strict'
import { chalk } from 'zx'
const logger = (message, options) => {
  const colors = {
    info: 'blue',
    success: 'green',
    warning: 'yellowBright',
    danger: 'red',
  }
  const titles = {
    info: '\u2771 Info',
    success: '\u2771 Ok',
    warning: '\u2771 Warning',
    danger: '\u2771 Error',
  }
  const color = options.level ? colors[options.level] : 'gray'
  const title = options.title ?? titles[options.level]
  console.log(`${''}${chalk[color](`${title}:`)}
`)
  console.log(`${''}${chalk.white(message)}
`)
  console.log(`${''}${chalk.grey('---')}
`)
}
export function err(message) {
  return logger(`${message}`, { level: 'danger' })
}
export function warn(message) {
  return logger(message, { level: 'warning' })
}
export function info(message) {
  return logger(message, { level: 'info' })
}
export function success(message) {
  return logger(message, { level: 'success' })
}
