'use strict'
export default {
  MASTER_KEYS: process.env.MASTER_KEYS || {
    pub: 'SECRETKEYS_PLEASECHANGE',
    priv: '_PLEASE_CHANGE_THIS_KEY',
    epub: '_OR_YOUWILLBEHACKED',
    epriv: '_ONCEAGAIN_CHANGE!!!',
  },
  LockerDirectory: process.env.LOCKER_DIRECTORY || '.chainlocker',
  DefaultVault: process.env.LOCKER_NAME || 'default',
  defaultRootNode: process.env.DEFAULT_ROOT_NODE ?? 'root',
}
