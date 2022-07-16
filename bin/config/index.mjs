'use strict'
export default {
  lockerDirectory: process.env.LOCKER_DIRECTORY || '.chainlocker',
  defaultVault: process.env.LOCKER_NAME || 'default',
  defaultRootNode: process.env.DEFAULT_ROOT_NODE ?? 'root',
}
