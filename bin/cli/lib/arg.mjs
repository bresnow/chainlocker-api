'use strict'
export const findArg = (argValue, { slice = 2, dash = false }) => {
  let args = process.argv.slice(slice)
  let i = 0,
    l = args.length
  for (i; i < l; i++) {
    let arg = args[i]
    if (dash) {
      if (arg.startsWith('--' + argValue)) {
        return [arg, args[i + 1]]
      }
    } else {
      if (arg.startsWith(argValue)) {
        return [arg, args[i + 1]]
      }
    }
  }
  return [null, null]
}
export const findParsed = (args, { dash = false, find, slice = 0 }) => {
  let i = 0,
    l = args.length
  for (i; i < l; i++) {
    let arg = args[i]
    if (dash) {
      if (arg?.startsWith('--' + find)) {
        return [arg[i], arg[i + 1]]
      }
    } else {
      if (arg?.startsWith(find)) {
        return [arg[i], arg[i + 1]]
      }
    }
  }
  return [null, null]
}
