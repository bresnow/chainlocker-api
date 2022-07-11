#!/usr/bin/env node
import { $, glob } from 'zx'
import 'zx/globals'
import getArgs from '../cli/utils/arg.mjs'

let arg = getArgs().argv

let matches = await glob(['**/*.mts', 'lib/**/*.mts'], { gitignore: true })
matches.forEach(async (file) => {
  await $`esbuild ${file} --outfile=${file.replace('mts', 'mjs')}`
})
await $`yarn zx cli/src/locker.mjs`
