export declare const flattenCommentsPages: (pageInstanceOrPagesInstance: any) => any[];
declare const utils: {
    merge: (...args: any) => any;
    clone: (obj: any) => any;
    flattenCommentsPages: (pageInstanceOrPagesInstance: any) => any[];
    retryInfinity: (f: any) => any;
    retryInfinityMinTimeout: number;
    retryInfinityMaxTimeout: number;
};
export declare const retryInfinity: (functionToRetry: any) => Promise<any>;
export default utils;
