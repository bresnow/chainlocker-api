'use strict'
import yargs from 'yargs'
export default function (args, slice = 3) {
  let arglist = yargs(args.slice(slice))
  return arglist
}
