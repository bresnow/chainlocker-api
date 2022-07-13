'use strict'
import { chalk, fs } from 'zx'
import rainbowRoad from './rainbowRoad.mjs'
let { version } = await fs.readJson('./package.json')
export default () => {
  console.log(`
${''}${rainbowRoad()}`)
  console.log(`${''}${rainbowRoad()}`)
  console.log(`${''}${rainbowRoad()}`)
  console.log(`${''}${chalk.cyanBright('\u2771\u2771 ChainLocker \u2771\u2771')} ${chalk.yellowBright(` Alpha v${version} \u2771\u2771`)}`)
  console.log(`${''}${chalk.white('Distributed and Encrypted P2P Graph Database Protocol. ')}
`)
  console.log(`${''}${rainbowRoad()}
`)
  console.log(`${''}${chalk.white.bold('Available Commands:')}
`)
  console.log(`${'\u2771\u2771 legend \u2771\u2771              '}${chalk.white('CMD  [ OPTIONS [--FLAGS]  ]  <INPUT> ')}
`)
  console.log(`${'\u2771\u2771 retrieve data \u2771\u2771       '}${chalk.white(
    'get [ path/to/desired/node/record [ --serve | --write | --pipe ]]'
  )}
`)
  console.log(`${'\u2771\u2771 store data \u2771\u2771          '}${chalk.white(
    'put [ path/to/desired/node/record [ --file | --url | --serve ]] < data >'
  )}
`)
  console.log(`${'\u2771\u2771 locker options \u2771\u2771      '}${chalk.white(
    'locker [ list | switch | delete | purge [ --force | --all ]]  < locker >'
  )}
`)
  console.log(`${'\u2771\u2771 relay options \u2771\u2771       '}${chalk.white('relay [ deploy | list | peer [--port ] ]')}
`)
  console.log(`${'\u2771\u2771 peer options \u2771\u2771        '}${chalk.white('peer [ add | remove ] < http://peer-host.tld >')}
`)
  console.log(`
${''}${chalk.white('Chainlocker is superpowered by GUN. https://gun.eco ')}
`)
  console.log(`${''}${rainbowRoad()}`)
  console.log(`${''}${rainbowRoad()}`)
  console.log(`${''}${rainbowRoad()}`)
}
