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
  console.log(`
${''}${chalk.white('Chainlocker is superpowered by GUN. https://gun.eco ')}`)
  console.log(`${''}${rainbowRoad()}`)
  console.log(`${''}${rainbowRoad()}`)
  console.log(`${''}${rainbowRoad()}`)
}
