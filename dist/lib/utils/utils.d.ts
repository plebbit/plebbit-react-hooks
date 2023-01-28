export declare const flattenCommentsPages: (pageInstanceOrPagesInstance: any) => any[];
declare const utils: {
    merge: (...args: any) => any;
    clone: (obj: any) => any;
    flattenCommentsPages: (pageInstanceOrPagesInstance: any) => any[];
    retryInfinity: (f: any) => Promise<unknown>;
    retryInfinityMinTimeout: number;
    retryInfinityMaxTimeout: number;
};
export declare const retryInfinity: (functionToRetry: any) => Promise<unknown>;
export default utils;
