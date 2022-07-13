#!/usr/bin/env node
'use strict'
import { $, glob } from 'zx'
import 'zx/globals'
import esbuild from 'esbuild'
let matches = await glob(['**/*.mts', '**/*.mjs'], { gitignore: true })
matches.forEach((file) => {
  esbuild.build({
    entryPoints: [file],
    outfile: `bin/${file.replace('mts', 'mjs')}`,
    bundle: false,
    platform: 'node',
  })
})
await $`node bin/cli/src/index.mjs`
