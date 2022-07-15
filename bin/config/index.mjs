'use strict'
export default {
  LockerDirectory: process.env.LOCKER_DIRECTORY || '.chainlocker',
  DefaultVault: process.env.LOCKER_NAME || 'default',
  defaultRootNode: process.env.DEFAULT_ROOT_NODE ?? 'root',
}
