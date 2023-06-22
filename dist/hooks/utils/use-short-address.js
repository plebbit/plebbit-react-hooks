import utils from '../../lib/utils';
import { useEffect, useState } from 'react';
const useShortAddress = (address) => {
    const [shortAddress, setShortAddress] = useState();
    useEffect(() => {
        utils.getShortAddress(address).then((_shortAddress) => {
            if (_shortAddress !== shortAddress) {
                setShortAddress(_shortAddress);
            }
        });
    }, [address]);
    return shortAddress;
};
export default useShortAddress;
