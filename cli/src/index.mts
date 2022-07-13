import { question, chalk } from 'zx'
//@ts-ignore
import Run from './runner.mjs'
import Help from '../lib/help.mjs'

Help()
await Run('root')
