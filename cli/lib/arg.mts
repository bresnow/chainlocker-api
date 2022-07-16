/**
 * Argument filter/parser in a single line.
 * @param argValue what to find
 * @param slice  how many args to skip
 * @param opts dash: looking for a double dash?
 * @returns tuple of [arg, argValue]
 */
export const findArg = (argValue: string, slice = 2, opts?: { dash: false }) =>
  process.argv.slice(slice)[1] === (opts?.dash ? '--' : '') + argValue.toLowerCase().trim()
    ? [process.argv.slice(slice)[0], process.argv.slice(slice)[1]]
    : [null, null]

// was gonna quit coding if i had to for loop every argument. Not really
