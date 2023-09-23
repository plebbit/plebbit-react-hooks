import { useState } from 'react';
export default function usePrevious(value) {
    const [current, setCurrent] = useState(value);
    const [previous, setPrevious] = useState();
    if (value !== current) {
        setPrevious(current);
        setCurrent(value);
    }
    return previous;
}
