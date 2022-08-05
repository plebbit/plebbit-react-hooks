import React from 'react';
import FeedsProvider from './feeds';
export default function PlebbitProvider(props) {
    if (!props.children) {
        return null;
    }
    // TODO: remove feeds provider to be a zustand store only
    return React.createElement(FeedsProvider, null, props.children);
}
