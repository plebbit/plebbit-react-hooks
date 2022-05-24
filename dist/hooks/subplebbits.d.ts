/**
 * @param subplebbitAddress - The address of the subplebbit, e.g. 'memes.eth', 'Qm...', etc
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export declare function useSubplebbit(subplebbitAddress?: string, accountName?: string): any;
/**
 * @param subplebbitAddresses - The addresses of the subplebbits, e.g. ['memes.eth', 'Qm...']
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export declare function useSubplebbits(subplebbitAddresses?: string[], accountName?: string): any[];
/**
 * Returns all the subplebbits created by plebbit-js by calling plebbit.listSubplebbits()
 */
export declare function useListSubplebbits(): string[];
