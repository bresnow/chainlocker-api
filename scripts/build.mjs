#!/usr/bin/env node
import { glob } from 'zx'
import 'zx/globals'
import esbuild from 'esbuild'

let matches = await glob(['**/*.mts'], { gitignore: true })

matches.forEach( (match) => {

  esbuild.buildSync({target: 'es2020', entryPoints: [match]})
})



await esbuild.build({ entryPoints: ['src/index.mts'], outfile: 'dist/index.js', bundle: true })
await $`tsc -p tsconfig.json`