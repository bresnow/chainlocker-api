/**
 * Argument filter/parser in a single line.
 * @param argValue what to find
 * @param slice  how many args to skip
 * @param opts dash: looking for a double dash?
 * @returns tuple of [arg, argValue]
 */
export const findArg = (argValue: string, slice = 2, opts?: { dash: boolean }) =>
  process.argv.slice(slice)[1] === (opts?.dash ? '--' : '') + argValue.toLowerCase().trim()
    ? [process.argv.slice(slice)[0], process.argv.slice(slice)[1]]
    : [null, null]

// was gonna quit coding if i had to for loop every argument. Not really

/**
 * Get the values of a previously parsed argument.
 */
export const findParsed = (args: (string | null)[], { dash = false, find, slice = 0 }: { dash?: boolean; find: string; slice?: number }) =>
  args.slice(slice)[1] === (dash ? '--' : '') + find.toLowerCase().trim() ? [args.slice(slice)[0], args.slice(slice)[1]] : [null, null]
