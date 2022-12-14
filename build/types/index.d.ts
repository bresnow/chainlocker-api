/// <reference types="node" />
import { IGunInstanceRoot, ISEAPair } from 'gun';
import 'gun/lib/path.js';
import 'gun/lib/load.js';
import 'gun/lib/open.js';
import 'gun/lib/then.js';
export declare const getCID: (vaultname: string, keypair: ISEAPair) => Promise<string>;
declare module 'gun/types' {
    interface IGunInstance<TNode> {
        /**
         * Create a new vault context.
         *
         * Takes the lockername and generates the keys against machine info.
         * Should require sudo privilages to create a new vault.
         *
         */
        vault(vaultname: string, keys: ISEAPair, cb?: CallBack): IGunUserInstance<any, any, any, IGunInstanceRoot<any, IGunInstance<any>>>;
        /**
         * Get a locker instance for a node in the chain.
         *
         * @param {string}
         */
        locker(nodepath: string | string[]): {
            value(cb: CallBack): Promise<Record<string, any>>;
            put(data: string | Record<string, any> | undefined, cb?: CallBack): Promise<void>;
        };
        keys(secret?: string | string[], callback?: CallBack): Promise<ISEAPair>;
    }
    interface IGunUserInstance {
        /**
         * Create a new vault context.
         *
         * Takes the lockername and generates the keys against machine info.
         * Should require sudo privilages to create a new vault.
         *
         */
        vault(vaultname: string, keys: ISEAPair, cb?: CallBack): IGunUserInstance<any, any, any, IGunInstanceRoot<any, IGunInstance<any>>>;
        /**
         * Get a locker instance for a node in the chain.
         *
         * @param {string}
         */
        locker(nodepath: string | string[]): {
            value(cb: CallBack): Promise<Record<string, any>>;
            put(data: string | Record<string, any> | undefined, cb?: CallBack): Promise<void>;
        };
        keys(secret?: string | string[], callback?: CallBack): Promise<ISEAPair>;
    }
    interface IGunChain<TNode> {
        /**
         * Create a new vault context.
         *
         * Takes the lockername and generates the keys against machine info.
         * Should require sudo privilages to create a new vault.
         *
         */
        vault(vaultname: string, keys: ISEAPair, cb?: CallBack): IGunUserInstance<any, any, any, IGunInstanceRoot<any, IGunInstance<any>>>;
        /**
         * Get a locker instance for a node in the chain.
         *
         * @param {string}
         */
        locker(nodepath: string | string[]): {
            value(cb: CallBack): Promise<Record<string, any>>;
            put(data: string | Record<string, any> | undefined, cb?: CallBack): Promise<void>;
        };
        keys(secret?: string | string[], callback?: CallBack): Promise<ISEAPair>;
    }
}
export declare type ScopeCb = (path?: string, event?: 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir', matches?: string[]) => void;
export declare type CallBack = (...ack: any) => void;
export declare type VaultOpts = {
    keys: ISEAPair;
    encoding?: 'utf16' | 'base64' | 'uint8array' | 'uri';
};
export declare function SysUserPair(secret?: string | any[], opts?: {
    alias: string;
}): Promise<{
    keys: ISEAPair;
    username: string;
    serial: string | undefined;
}>;
export declare function getImmutableMachineInfo(): {
    username: string;
    platform: NodeJS.Platform;
    arch: string;
};
