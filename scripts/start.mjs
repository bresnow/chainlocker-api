#!/usr/bin/env node
import { $, glob } from 'zx'
import 'zx/globals'
import esbuild from 'esbuild'

let matches = await glob(['**/*.mts'], { gitignore: true })
matches.forEach((file) => {
  esbuild.build({
    entryPoints: [file],
    outfile: `bin/${file.replace('mts', 'mjs')}`,
    bundle: false,
    platform: 'node',
  })
})

await $`node bin/index.mjs`
