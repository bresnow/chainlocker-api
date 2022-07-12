'use strict'
import { chalk } from 'zx'
import rainbowRoad from './rainbowRoad.mjs'
export default (message, options) => {
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
  const title = options.level ? titles[options.level] : 'Help'
  const docs = options.docs || void 0
  console.log(`
${options.padding || ''}${rainbowRoad()}
`)
  console.log(`${options.padding || ''}${chalk[color](`${title}:`)}
`)
  console.log(`${options.padding || ''}${chalk.white(message)}
`)
  console.log(`${options.padding || ''}${chalk.grey('---')}
`)
  if (docs) {
    console.log(`${options.padding || ''}${chalk.white('Relevant Documentation:')}
`)
    console.log(`${options.padding || ''}${chalk.blue(docs)}
`)
    console.log(`${options.padding || ''}${chalk.white('Stuck? Ask a Question:')}
`)
  }
  if (options.tools && Array.isArray(options.tools)) {
    console.log(`${options.padding || ''}${chalk.white('Current comands:')}
`)
    options.tools.forEach((tool) => {
      console.log(`${options.padding || ''}${chalk.blue(`${tool.title} \u2014 ${tool.text}`)}
`)
    })
  }
  console.log(`${options.padding || ''}${rainbowRoad()}
`)
}
