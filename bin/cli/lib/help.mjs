'use strict'
import { chalk, fs } from 'zx'
import rainbowRoad from './rainbowRoad.mjs'
let { version } = await fs.readJson('./package.json')
export default (which = 'all') => {
  console.log(`${''}${rainbowRoad()}`)
  console.log(
    `${''}${chalk.cyanBright.bold.underline('\u2771\u2771 ChainLocker \u2771\u2771')} ${chalk.yellowBright.underline(
      ` Alpha v${version} \u2771\u2771`
    )}`
  )
  console.log(`${''}${chalk.white('Distributed and Encrypted P2P Graph Database Protocol. ')}
`)
  console.log(`${''}${rainbowRoad()}`)
  if (which == 'chainlocker') {
    console.log(
      `${chalk.cyan.bold('                  ')}${chalk.white(
        `chainlocker  [   vault   ]  current (${chalk.italic('shows current vault context')})   `
      )}`
    )
    console.log(
      `${chalk.blueBright('                 ')}${chalk.white(
        `                            --new (${chalk.italic('create new vault context')})   `
      )}`
    )
    console.log(`${chalk.blueBright('                 ')}${chalk.red(
      `IN DEV                        --delete (${chalk.italic('delete current vault context')})   `
    )}
`)
    console.log(
      `${chalk.blueBright('                 ')}${chalk.white(
        `             [   keys    ]  --show (${chalk.italic('shows the keypair to current vault context')}) `
      )}`
    )
    console.log(
      `${chalk.blueBright('                 ')}${chalk.white(
        `                            --generate (${chalk.italic('generate and name new keypair to store in current vault context')})   `
      )}`
    )
    console.log(
      `${chalk.blueBright('                 ')}${chalk.red(
        `IN DEV                        --env (${chalk.italic('set keypair as environment variable')})   `
      )}`
    )
  }
  if (which == 'store') {
    console.log(`
${chalk.cyan.bold('\u2771\u2771 DATABASE  \u2771\u2771   ')}
`)
    console.log(
      `${chalk.blueBright('\u2771\u2771 Get Data  \u2771\u2771  ')}${chalk.white(
        '<--path/to/node/record-->  [   get   ]   --exec <node || shell || env || docker(IN DEV)> '
      )}`
    )
    console.log(
      `${chalk.blueBright('                ')}${chalk.white(
        '                                         --write-file <absolute local file path> '
      )}`
    )
    console.log(`${chalk.blueBright('                ')}${chalk.white(
      '                                         --write-file <absolute local file path> '
    )}
`)
    console.log(`${chalk.cyan.bold('\u2771\u2771 Put Data  \u2771\u2771   ')}${chalk.white(
      '<--path/to/node/record-->  [   put   ]   --file <absolute local file path> '
    )}
`)
    console.log(
      `${chalk.blueBright('                ')}${chalk.white('                                         --url <domain or ip addr> ')}`
    )
    console.log(`${chalk.blueBright('                ')}${chalk.white('                                         --string <stdin> ')}`)
  }
  console.log(`
${''}${chalk.white('Chainlocker is superpowered by GUN. https://gun.eco ')}`)
  console.log(`${''}${rainbowRoad()}`)
  console.log(`${''}${rainbowRoad()}`)
  console.log(`${''}${rainbowRoad()}`)
}
