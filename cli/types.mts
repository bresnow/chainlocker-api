import { FSWatcher } from 'chokidar'
import { Stats } from 'fs'
import { IGunChain, IGunInstanceRoot, IGunUserInstance, ISEAPair } from 'gun'

declare module 'gun/types' {
  export interface IGunInstance<TNode> extends IGunUserInstance<TNode> {
    /**
     * Create a new vault context.
     *
     * Takes the lockername and generates the keys against machine info.
     * Should require sudo privilages to create a new vault.
     *
     */
    vault(vaultname: string, cb?: CallBack, options?: VaultOpts): IGunUserInstance<any, any, any, IGunInstanceRoot<any, IGunInstance<any>>>
    /**
     * Get a locker instance for a node in the chain.
     *
     * @param {string}
     */
    locker(nodepath: string | string[]): { value(cb: CallBack): Promise<void>; put(data: any, cb?: CallBack): Promise<void> }
    keys(secret?: string | string[]): Promise<ISEAPair>
  }

  export interface IGunChain<TNode> extends IGunInstance {
    scope(
      what: string[],
      callback: ScopeCb | undefined,
      opts: {
        verbose: boolean
        alias: string
      }
    ): Promise<void>
  }
}
export type ScopeCb = (path?: string, event?: 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir', matches?: string[]) => void
export type CallBack = (...ack: any) => void

export type VaultOpts = { keys?: ISEAPair; encoding?: 'utf16' | 'base64' | 'uint8array' | 'uri' }
