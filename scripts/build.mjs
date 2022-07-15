#!/usr/bin/env node
import { glob } from 'zx'
import 'zx/globals'
import esbuild from 'esbuild'

let matches = await glob(['**/*.mts', 'cli/**/*.mjs'], { gitignore: true })
matches.forEach((file) => {
  console.log(file)
  esbuild.build({
    entryPoints: [file],
    outfile: `bin/${file.replace('ts', 'js')}`,
    bundle: false,
    platform: 'node',
  })
})
