import yargs, { Argv } from 'yargs'

export default function <ArgumentType extends string[]>(args: ArgumentType, slice = 3): Argv<ArgumentType> {
  let arglist = yargs(args.slice(slice))
  return arglist as Argv<ArgumentType>
}
