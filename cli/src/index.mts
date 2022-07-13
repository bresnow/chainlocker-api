import { question, chalk } from 'zx'
import Run from './run.mjs'
import Help from '../lib/help.mjs'

Help()

await Run('root')
