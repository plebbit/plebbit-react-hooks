import utils from '../../lib/utils';
import { useEffect, useState } from 'react';
const useShortCid = (cid) => {
    const [shortCid, setShortCid] = useState();
    useEffect(() => {
        utils.getShortCid(cid).then((_shortCid) => {
            if (_shortCid !== shortCid) {
                setShortCid(_shortCid);
            }
        });
    }, [cid]);
    return shortCid;
};
export default useShortCid;
