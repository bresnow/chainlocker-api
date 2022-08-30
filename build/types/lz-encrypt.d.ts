import { ISEAPair } from 'gun';
declare function encrypt(object: any, encryptionkey: ISEAPair | {
    epriv: string;
}, compressionOptions?: Partial<{
    compress: boolean;
    encoding: 'utf16' | 'uint8array' | 'base64' | 'uri';
}>): Promise<string | Record<string, any> | undefined>;
declare function decrypt(object: any, encryptionkey: ISEAPair | {
    epriv: string;
}, compressionOptions?: Partial<{
    compress: boolean;
    encoding: 'utf16' | 'uint8array' | 'base64' | 'uri';
}>): Promise<any>;
declare const _default: {
    encrypt: typeof encrypt;
    decrypt: typeof decrypt;
};
export default _default;
