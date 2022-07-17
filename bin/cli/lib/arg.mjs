'use strict'
export const findArg = (argValue, slice = 2, opts) =>
  process.argv.slice(slice)[1] === (opts?.dash ? '--' : '') + argValue.toLowerCase().trim()
    ? [process.argv.slice(slice)[0], process.argv.slice(slice)[1]]
    : [null, null]
export const findParsed = (args, { dash = false, find, slice = 0 }) =>
  args.slice(slice)[1] === (dash ? '--' : '') + find.toLowerCase().trim() ? [args.slice(slice)[0], args.slice(slice)[1]] : [null, null]
