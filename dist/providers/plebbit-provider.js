import React from 'react';
import AccountsProvider from './accounts-provider';
import CommentsProvider from './comments-provider';
import SubplebbitsProvider from './subplebbits-provider';
import FeedsProvider from './feeds-provider';
export default function PlebbitProvider(props) {
    if (!props.children) {
        return null;
    }
    // AccountsProvider needs SubplebbitsProvider and vice versa so wrap SubplebbitsProvider twice
    return (React.createElement(SubplebbitsProvider, null,
        React.createElement(AccountsProvider, null,
            React.createElement(SubplebbitsProvider, null,
                React.createElement(CommentsProvider, null,
                    React.createElement(FeedsProvider, null, props.children))))));
}
