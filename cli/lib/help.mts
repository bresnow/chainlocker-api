import { chalk, fs } from 'zx'
import rainbowRoad from './rainbowRoad.mjs'

let { version } = await fs.readJson('./package.json')
export default (which: 'chainlocker' | 'store' | 'all' = 'all') => {
  console.log(`${''}${rainbowRoad()}`)
  //@ts-ignore
  console.log(`${''}${chalk.cyanBright.bold.underline('❱❱ ChainLocker ❱❱')} ${chalk.yellowBright.underline(' Alpha' + ` v${version} ❱❱`)}`)
  console.log(`${''}${chalk.white('Distributed and Encrypted P2P Graph Database Protocol. ')}\n`)
  console.log(`${''}${rainbowRoad()}`)
  if (which == ('chainlocker' || 'all')) {
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
    console.log(
      `${chalk.blueBright('                 ')}${chalk.red(
        `IN DEV                        --delete (${chalk.italic('delete current vault context')})   `
      )}\n`
    )
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
  //TODO: PEER,  RELAY
  if (which == ('store' || 'all')) {
    console.log(`\n${chalk.cyan.bold('❱❱ DATABASE  ❱❱   ')}\n`)
    console.log(
      `${chalk.blueBright('❱❱ Get Data  ❱❱  ')}${chalk.white(
        '<--path/to/node/record-->  [   get   ]   --exec <node || shell || env || docker(IN DEV)> '
      )}`
    )
    console.log(
      `${chalk.blueBright('                ')}${chalk.white(
        '                                         --write-file <absolute local file path> '
      )}`
    )
    console.log(
      `${chalk.blueBright('                ')}${chalk.white(
        '                                         --write-file <absolute local file path> '
      )}\n`
    )

    console.log(
      `${chalk.cyan.bold('❱❱ Put Data  ❱❱   ')}${chalk.white(
        '<--path/to/node/record-->  [   put   ]   --file <absolute local file path> '
      )}\n`
    )
    console.log(
      `${chalk.blueBright('                ')}${chalk.white('                                         --url <domain or ip addr> ')}`
    )
    console.log(`${chalk.blueBright('                ')}${chalk.white('                                         --string <stdin> ')}`)
  }
  console.log(`\n${''}${chalk.white('Chainlocker is superpowered by GUN. https://gun.eco ')}`)
  console.log(`${''}${rainbowRoad()}`)
  console.log(`${''}${rainbowRoad()}`)
  console.log(`${''}${rainbowRoad()}`)
}
