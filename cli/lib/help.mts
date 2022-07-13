import { chalk, fs } from 'zx'
import rainbowRoad from './rainbowRoad.mjs'

let { version } = await fs.readJson('./package.json')
export default () => {
  console.log(`\n${''}${rainbowRoad()}`)
  console.log(`${''}${rainbowRoad()}`)
  console.log(`${''}${rainbowRoad()}`)

  //@ts-ignore
  console.log(`${''}${chalk.cyanBright('❱❱ ChainLocker ❱❱')} ${chalk.yellowBright(' Alpha' + ` v${version} ❱❱`)}`)
  console.log(`${''}${chalk.white('Distributed and Encrypted P2P Graph Database Protocol. ')}\n`)
  console.log(`${''}${rainbowRoad()}\n`)

  console.log(`${''}${chalk.white.bold('Available Commands:')}\n`)
  console.log(`${'❱❱ legend ❱❱              '}${chalk.white('CMD  [ OPTIONS [--FLAGS]  ]  <INPUT> ')}\n`)
  console.log(`${'❱❱ retrieve data ❱❱       '}${chalk.white('get [ path/to/desired/node/record [ --serve | --write | --pipe ]]')}\n`)
  console.log(`${'❱❱ store data ❱❱          '}${chalk.white('put [ path/to/desired/node/record [ --file | --url | --serve ]] < data >')}\n`)
  console.log(`${'❱❱ locker options ❱❱      '}${chalk.white('locker [ list | switch | delete | purge [ --force | --all ]]  < locker >')}\n`)
  console.log(`${'❱❱ relay options ❱❱       '}${chalk.white('relay [ deploy | list | peer [--port ] ]')}\n`)
  console.log(`${'❱❱ peer options ❱❱        '}${chalk.white('peer [ add | remove ] < http://peer-host.tld >')}\n`)
  console.log(`\n${''}${chalk.white('Chainlocker is superpowered by GUN. https://gun.eco ')}\n`)
  console.log(`${''}${rainbowRoad()}`)
  console.log(`${''}${rainbowRoad()}`)
  console.log(`${''}${rainbowRoad()}`)
}
