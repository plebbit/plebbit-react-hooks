import {getNftImageUrl} from '.'

const avatarNft1 = {
  chainTicker: 'eth',
  address: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d', // the contract address of the nft
  id: 100, // the nft number 100 in the colletion
}
const avatarNft2 = {
  chainTicker: 'matic',
  address: '0xf6d8e606c862143556b342149a7fe0558c220375', // the contract address of the nft
  id: 100, // the nft number 100 in the colletion
}

const ipfsGatewayUrl = 'https://cloudflare-ipfs.com'

const blockchainProviders = {
  eth: {
    // default should not use a url, but rather ethers' default provider
    url: 'ethers.getDefaultProvider()',
    chainId: 1,
  },
  avax: {
    url: 'https://api.avax.network/ext/bc/C/rpc',
    chainId: 43114,
  },
  matic: {
    url: 'https://polygon-rpc.com',
    chainId: 137,
  },
}

describe('blockchain', () => {
  describe('nft', () => {
    const timeout = 30000
    jest.setTimeout(timeout)

    // skip because uses internet and not deterministic
    // also cache and pending is difficult to test without console logging it
    test.skip('getNftImageUrl (cache and pending)', async () => {
      const url = await getNftImageUrl(avatarNft1, ipfsGatewayUrl, blockchainProviders)
      console.log(url)
      const cachedUrl = await getNftImageUrl(avatarNft1, ipfsGatewayUrl, blockchainProviders)
      console.log(cachedUrl)

      const res = await Promise.all([getNftImageUrl(avatarNft2, ipfsGatewayUrl, blockchainProviders), getNftImageUrl(avatarNft2, ipfsGatewayUrl, blockchainProviders)])
      console.log(res)
    })
  })
})
