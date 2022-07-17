'use strict'
export default {
  radDir: process.env.LOCKER_DIRECTORY || '.chainlocker',
  defaultVault: process.env.LOCKER_NAME || 'default',
  defaultRootNode: process.env.DEFAULT_ROOT_NODE ?? 'root',
}
