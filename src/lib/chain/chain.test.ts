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

const chainProviders = {
  eth: {
    // default should not use a url, but rather ethers.js default provider
    urls: ['ethers.js'],
    chainId: 1,
  },
  avax: {
    urls: ['https://api.avax.network/ext/bc/C/rpc'],
    chainId: 43114,
  },
  matic: {
    urls: ['https://polygon-rpc.com'],
    chainId: 137,
  },
}

describe('chain', () => {
  describe('nft', () => {
    const timeout = 30000

    // skip because uses internet and not deterministic
    // also cache and pending is difficult to test without console logging it
    test.skip(
      'getNftImageUrl (cache and pending)',
      async () => {
        // const url = await getNftImageUrl(avatarNft1, ipfsGatewayUrl, chainProviders)
        // console.log(url)
        // const cachedUrl = await getNftImageUrl(avatarNft1, ipfsGatewayUrl, chainProviders)
        // console.log(cachedUrl)
        // const res = await Promise.all([getNftImageUrl(avatarNft2, ipfsGatewayUrl, chainProviders), getNftImageUrl(avatarNft2, ipfsGatewayUrl, chainProviders)])
        // console.log(res)
      },
      {timeout}
    )
  })
})
