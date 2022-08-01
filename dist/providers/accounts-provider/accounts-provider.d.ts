import React from 'react';
import { Props, Account } from '../../types';
export declare const AccountsContext: React.Context<any>;
export default function AccountsProvider(props: Props): JSX.Element | null;
/**
 * Poll all local subplebbits and start them if they are not started
 * TODO: find a better design and name for this hook
 */
export declare function useStartSubplebbits(account: Account): {
    [subplebbitAddress: string]: any;
};
