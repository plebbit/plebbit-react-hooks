/* usage:

useInterval(
  callback: () => void,
  delay: number,
  immediate?: boolean
)

*/
import { useEffect, useRef } from 'react';
/** keep typescript happy */
const noop = () => { };
export function useInterval(callback, delay, immediate, dependencies = []) {
    const savedCallback = useRef(noop);
    // Remember the latest callback.
    useEffect(() => {
        savedCallback.current = callback;
    });
    // Execute callback if immediate is set.
    useEffect(() => {
        if (!immediate)
            return;
        if (delay === null || delay === false)
            return;
        savedCallback.current();
    }, [immediate, ...dependencies]);
    // Set up the interval.
    useEffect(() => {
        if (delay === null || delay === false)
            return undefined;
        const tick = () => savedCallback.current();
        const id = setInterval(tick, delay);
        return () => clearInterval(id);
    }, [delay]);
}
export default useInterval;
