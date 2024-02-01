import { UsePlebbitRpcSettingsOptions, UsePlebbitRpcSettingsResult } from '../types';
/**
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export declare function usePlebbitRpcSettings(options?: UsePlebbitRpcSettingsOptions): UsePlebbitRpcSettingsResult;
