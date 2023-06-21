import utils from '../../lib/utils'
import {useEffect, useState} from 'react'

const useShortCid = (cid?: string) => {
  const [shortCid, setShortCid] = useState<string | undefined>()
  useEffect(() => {
    utils.getShortCid(cid).then((_shortCid: string | undefined) => {
      if (_shortCid !== shortCid) {
        setShortCid(_shortCid)
      }
    })
  }, [cid])
  return shortCid
}

export default useShortCid
