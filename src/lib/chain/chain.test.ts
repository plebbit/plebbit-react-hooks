import {getNftImageUrl, getEthWalletFromPlebbitPrivateKey, getSolWalletFromPlebbitPrivateKey, getEthPrivateKeyFromPlebbitPrivateKey, getSolPrivateKeyFromPlebbitPrivateKey, validateEthWallet, validateSolWallet} from '.'

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

const plebbitPrivateKey = 'mV8GRU5TGScen7UYZOuNQQ1CKe2G46DCc60moM1yLF4'
const authorAddress = 'authoraddress.eth'
const walletTimestamp = 1740000000000

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

  describe('eth wallet', () => {
    let wallet, privateKey
    beforeAll(async () => {
      privateKey = await getEthPrivateKeyFromPlebbitPrivateKey(plebbitPrivateKey)
      const dateNow = Date.now
      Date.now = () => walletTimestamp
      wallet = await getEthWalletFromPlebbitPrivateKey(plebbitPrivateKey, authorAddress)
      Date.now = dateNow
    })

    test('getEthWalletFromPlebbitPrivateKey', async () => {
      expect(wallet.timestamp).toBe(walletTimestamp)
      expect(wallet.address).toBe('0x37BC48124fDf985DC3983E2e8414606D4a996ED7')
      expect(wallet.privateKey).toBe(undefined)
      expect(privateKey).toBe('0x995f06454e5319271e9fb51864eb8d410d4229ed86e3a0c273ad26a0cd722c5e')
      expect(wallet.signature.type).toBe('eip191')
      expect(wallet.signature.signature).toBe('0xaa9ddcd4efb2fa27b779a81cc33a020276b6a0429f6e7e92bbadb254abd805c03de6d00df328a229414f6909cd67674ac54a0bde762e8a9e5b4adfa0345faf141b')
    })

    test('validateEthWallet', async () => {
      // good signature
      await validateEthWallet(wallet, authorAddress)

      // bad signatures
      await expect(validateEthWallet({...wallet, timestamp: wallet.timestamp + 1}, authorAddress)).rejects
        .toThrow('wallet address does not equal signature address')
      await expect(validateEthWallet(wallet, 'invalidauthoraddress.eth')).rejects
        .toThrow('wallet address does not equal signature address')
      await expect(validateEthWallet({...wallet, timestamp: undefined}, authorAddress)).rejects
        .toThrow(`validateEthWallet invalid wallet.timestamp 'undefined' not a number`)
      await expect(validateEthWallet({...wallet, signature: undefined}, authorAddress)).rejects
        .toThrow(`validateEthWallet invalid wallet.signature 'undefined'`)
      await expect(validateEthWallet({...wallet, signature: {type: 'eip191'}}, authorAddress)).rejects
        .toThrow(`validateEthWallet invalid wallet.signature.signature 'undefined'`)
      await expect(validateEthWallet({...wallet, signature: {}}, authorAddress)).rejects
        .toThrow(`validateEthWallet invalid wallet.signature.signature 'undefined'`)
      await expect(validateEthWallet({...wallet, address: undefined}, authorAddress)).rejects
        .toThrow(`validateEthWallet invalid wallet.address 'undefined'`)
      await expect(validateEthWallet({...wallet, address: '0x0000000000000000000000000000000000000000'}, authorAddress)).rejects
        .toThrow('wallet address does not equal signature address')
    })
  })

  describe('sol wallet', () => {
    let wallet, privateKey
    beforeAll(async () => {
      privateKey = await getSolPrivateKeyFromPlebbitPrivateKey(plebbitPrivateKey)
      const dateNow = Date.now
      Date.now = () => walletTimestamp
      wallet = await getSolWalletFromPlebbitPrivateKey(plebbitPrivateKey, authorAddress)
      Date.now = dateNow
    })

    test('getEthWalletFromPlebbitPrivateKey', async () => {
      expect(wallet.timestamp).toBe(walletTimestamp)
      expect(wallet.address).toBe('AzAfDLMxbptaq5Ppy4BK5aEsEzvTYNFAub5ffewbSdn9')
      expect(wallet.privateKey).toBe(undefined)
      expect(privateKey).toBe('44rJnvSKZwF6qMrc49MVe4KqcugR8zc8B4i1yo9iXrvKsf6FAFB7x1dSNdbAqqga4xvpU7VmnKRkwyvQWxrcBmGV')
      expect(wallet.signature.type).toBe('sol')
      expect(wallet.signature.signature).toBe('5rSeVjVpsFS7fipN19buEJtNd6mHqp8K5RJXvPVRzH6VbiseAFu8wiRTfQCGkGKrfByuodvSFkKN51JkaLUVk2B9')
    })

    test('validateSolWallet', async () => {
      // good signature
      await validateSolWallet(wallet, authorAddress)

      // bad signatures
      await expect(validateSolWallet({...wallet, timestamp: wallet.timestamp + 1}, authorAddress)).rejects
        .toThrow('signature invalid')
      await expect(validateSolWallet(wallet, 'invalidauthoraddress.eth')).rejects
        .toThrow('signature invalid')
      await expect(validateSolWallet({...wallet, timestamp: undefined}, authorAddress)).rejects
        .toThrow(`validateSolWallet invalid wallet.timestamp 'undefined' not a number`)
      await expect(validateSolWallet({...wallet, signature: undefined}, authorAddress)).rejects
        .toThrow(`validateSolWallet invalid wallet.signature 'undefined'`)
      await expect(validateSolWallet({...wallet, signature: {}}, authorAddress)).rejects
        .toThrow(`validateSolWallet invalid wallet.signature.signature 'undefined'`)
      await expect(validateSolWallet({...wallet, address: undefined}, authorAddress)).rejects
        .toThrow(`validateSolWallet invalid wallet.address 'undefined'`)
      await expect(validateSolWallet({...wallet, address: '11111111111111111111111111111111'}, authorAddress)).rejects
        .toThrow('signature invalid')
    })
  })
})
