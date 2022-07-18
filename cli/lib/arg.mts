/**
 * Argument filter/parser in a single line.
 * @param argValue what to find
 * @param slice  how many args to skip
 * @param opts dash: looking for a double dash?
 * @returns tuple of [arg, argValue]
 */
export const findArg = (argValue: string, { slice = 2, dash = false }) => {
  let args = process.argv.slice(slice)
  let i = 0,
    l = args.length
  for (i; i < l; i++) {
    let arg = args[i]
    if (dash) {
      if (arg.startsWith(('--' || '-') + argValue)) {
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

// was gonna quit coding if i had to for loop every argument. Not really

/**
 * Get the values of a previously parsed argument.
 */
export const findParsed = (
  args: (string | null)[],
  { dash = false, find, slice = 0 }: { dash?: boolean; find: string; slice?: number }
) => {
  let i = 0,
    l = args.length
  for (i; i < l; i++) {
    let arg = args[i]
    if (dash) {
      if (arg?.startsWith(('--' || '-') + find)) {
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
