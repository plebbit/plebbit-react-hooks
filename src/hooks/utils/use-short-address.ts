import utils from '../../lib/utils'
import {useEffect, useState} from 'react'

const useShortAddress = (address?: string) => {
  const [shortAddress, setShortAddress] = useState<string | undefined>()
  useEffect(() => {
    utils.getShortAddress(address).then((_shortAddress: string | undefined) => {
      if (_shortAddress !== shortAddress) {
        setShortAddress(_shortAddress)
      }
    })
  }, [address])
  return shortAddress
}

export default useShortAddress
