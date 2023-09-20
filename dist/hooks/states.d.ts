import { UseClientsStatesOptions, UseClientsStatesResult } from '../types';
/**
 * @param comment - The comment to get the states from
 * @param subplebbit - The subplebbit to get the states from
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export declare function useClientsStates(options?: UseClientsStatesOptions): UseClientsStatesResult;
