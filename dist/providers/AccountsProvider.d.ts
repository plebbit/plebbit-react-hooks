import React from 'react';
declare type Props = {
    children?: React.ReactChild;
};
declare type Account = any;
declare type Accounts = {
    [key: string]: Account;
};
export declare const AccountsContext: React.Context<Accounts | undefined>;
export default function AccountsProvider(props: Props): JSX.Element | null;
export {};
