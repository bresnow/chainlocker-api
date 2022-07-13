#!/usr/bin/env node
'use strict'
import { glob } from 'zx'
import 'zx/globals'
import esbuild from 'esbuild'
let matches = await glob(['**/*.mts', 'index.ts', 'cli/src/chainlocker.mjs'], { gitignore: true })
matches.forEach((file) => {
  console.log(file)
  esbuild.build({
    entryPoints: [file],
    outfile: `bin/${file.replace('ts', 'js')}`,
    bundle: false,
    platform: 'node',
  })
})
