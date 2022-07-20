import { chalk } from 'zx'
import rainbowRoad from './rainbowRoad.mjs'

const logger = (message: string, options: { level: 'info' | 'success' | 'warning' | 'danger'; title?: string }) => {
  const colors = {
    info: 'blue',
    success: 'green',
    warning: 'yellowBright',
    danger: 'red',
  }

  const titles = {
    info: '❱ Info',
    success: '❱ Ok',
    warning: '❱ Warning',
    danger: '❱ Error',
  }

  const color = options.level ? colors[options.level] : 'gray'
  const title = options.title ?? titles[options.level]

  //@ts-ignore
  console.log(`${''}${chalk[color](`${title}:`)}\n`)
  console.log(`${''}${chalk.white(message)}\n`)
  console.log(`${''}${chalk.grey('---')}\n`)
}

export function err(message: unknown) {
  return logger(`${message}`, { level: 'danger' })
}

export function warn(message: string) {
  return logger(message, { level: 'warning' })
}

export function info(message: string) {
  return logger(message, { level: 'info' })
}

export function success(message: string) {
  return logger(message, { level: 'success' })
}
