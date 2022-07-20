import Gun from 'gun'
import '../bin/cli/lib/chain-hooks/scope.mjs'
const gun = Gun()

gun.scope(['**/*'], async function (event, { path, matches }) {})
