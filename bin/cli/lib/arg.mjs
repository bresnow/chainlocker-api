'use strict'
export const findArg = (argValue, { slice = 2, dash = false, valueIsArray = false }) => {
  let args = process.argv.slice(slice)
  let i = 0,
    l = args.length
  for (i; i < l; i++) {
    let arg = args[i]
    let [_arg, ..._args] = [args[i], ...args.slice(i + 1)]
    if (dash) {
      if (arg === '--' + argValue) {
        return !valueIsArray ? [arg, args[i + 1]] : [_arg, ..._args]
      }
    } else {
      if (arg === argValue) {
        return !valueIsArray ? [arg, args[i + 1]] : [_arg, ..._args]
      }
    }
  }
  return [null, ...args]
}
export const findParsed = (args, { dash = false, find, slice = 0 }) => {
  let i = 0,
    l = args.length
  for (i; i < l; i++) {
    let arg = args[i]
    if (dash) {
      if (arg?.startsWith('--')) {
        return [arg[i], arg[i + 1]]
      }
    } else {
      if (arg === find) {
        return [arg[i], arg[i + 1]]
      }
    }
  }
  return [null, null]
}
