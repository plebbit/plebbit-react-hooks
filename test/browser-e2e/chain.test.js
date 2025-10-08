import {
  getEthWalletFromPlebbitPrivateKey,
  getSolWalletFromPlebbitPrivateKey,
  getEthPrivateKeyFromPlebbitPrivateKey,
  getSolPrivateKeyFromPlebbitPrivateKey,
  validateEthWallet,
  validateSolWallet,
} from '../../dist'

const plebbitPrivateKey = 'mV8GRU5TGScen7UYZOuNQQ1CKe2G46DCc60moM1yLF4'
const authorAddress = 'authoraddress.eth'
const walletTimestamp = 1740000000

describe('chain', () => {
  describe('eth wallet', () => {
    let wallet, privateKey
    beforeAll(async () => {
      privateKey = await getEthPrivateKeyFromPlebbitPrivateKey(plebbitPrivateKey)
      const dateNow = Date.now
      Date.now = () => walletTimestamp * 1000
      wallet = await getEthWalletFromPlebbitPrivateKey(plebbitPrivateKey, authorAddress)
      Date.now = dateNow
    })

    test('getEthWalletFromPlebbitPrivateKey', async () => {
      expect(wallet.timestamp).toBe(walletTimestamp)
      expect(wallet.address).toBe('0x37BC48124fDf985DC3983E2e8414606D4a996ED7')
      expect(wallet.privateKey).toBe(undefined)
      expect(privateKey).toBe('0x995f06454e5319271e9fb51864eb8d410d4229ed86e3a0c273ad26a0cd722c5e')
      expect(wallet.signature.type).toBe('eip191')
      expect(wallet.signature.signature).toBe(
        '0xea38d758767f746fa73761a0e5c60a810ee6762ab2d6fd0d9d3390d9e5e60f304c91aebb91f4f7337321cebbfbbf8206ee4ec92909f136ba5ff546322434a90c1b'
      )
    })

    test('validateEthWallet', async () => {
      // good signature
      await validateEthWallet(wallet, authorAddress)

      // bad signatures
      await expect(validateEthWallet({...wallet, timestamp: wallet.timestamp + 1}, authorAddress)).rejects.toThrow('wallet address does not equal signature address')
      await expect(validateEthWallet(wallet, 'invalidauthoraddress.eth')).rejects.toThrow('wallet address does not equal signature address')
      await expect(validateEthWallet({...wallet, timestamp: undefined}, authorAddress)).rejects.toThrow(
        `validateEthWallet invalid wallet.timestamp 'undefined' not a number`
      )
      await expect(validateEthWallet({...wallet, signature: undefined}, authorAddress)).rejects.toThrow(`validateEthWallet invalid wallet.signature 'undefined'`)
      await expect(validateEthWallet({...wallet, signature: {type: 'eip191'}}, authorAddress)).rejects.toThrow(
        `validateEthWallet invalid wallet.signature.signature 'undefined'`
      )
      await expect(validateEthWallet({...wallet, signature: {}}, authorAddress)).rejects.toThrow(`validateEthWallet invalid wallet.signature.signature 'undefined'`)
      await expect(validateEthWallet({...wallet, address: undefined}, authorAddress)).rejects.toThrow(`validateEthWallet invalid wallet.address 'undefined'`)
      await expect(validateEthWallet({...wallet, address: '0x0000000000000000000000000000000000000000'}, authorAddress)).rejects.toThrow(
        'wallet address does not equal signature address'
      )
    })

    test('validateEthWallet fixture wallet', async () => {
      const authorAddress = '12D3KooWRLHxva6Mrt2fxuL4hMeGJCs8erHAAoXCzPGLsdLpdvrF'
      const wallet = {
        address: '0x172bb210Ebf51882b63d59609A7BC5c70ce84311',
        timestamp: 1758422293,
        signature: {
          signature: '0x0d2a091975bcaa4895eb532a74bdef7060db7980ec7bed47812a3e26d5138ea712b890151c117d5e28739b40303b186dc58483065e7390238bd9902e88dbd1071c',
          type: 'eip191',
        },
      }
      await validateEthWallet(wallet, authorAddress)
    })

    test('fixture wallet 2', async () => {
      const plebbitPrivateKey = 'Q2dsIzBWgHZuof0Aq1KhtMhmW2z5gM8NYY0NL+daBcI'
      const authorAddress = '12D3KooWNzFJQ7CCcSCZNg7925WWHMzqVS4qe663PfQ3uBNCHZQb'
      const wallet = {
        address: '0x9097084f571AF3BFcc64E4dcA33FB3223071E4aB',
        timestamp: 1759958639,
        signature: {
          signature: '0x1212ac6953a8d5e5adfc6ec9964042d9b3fc4241a72bfabbccef26cd74d35be5029485b2c1187c3423f05acf7f49694dfa00480c5a203ba08c9773b4517054e71b',
          type: 'eip191',
        },
      }

      const dateNow = Date.now
      Date.now = () => wallet.timestamp * 1000
      const generatedWallet = await getEthWalletFromPlebbitPrivateKey(plebbitPrivateKey, authorAddress)
      Date.now = dateNow

      expect(wallet.address).toBe(generatedWallet.address)
      expect(wallet.timestamp).toBe(generatedWallet.timestamp)
      expect(wallet.signature.signature).toBe(generatedWallet.signature.signature)

      await validateEthWallet(wallet, authorAddress)
    })
  })

  describe('sol wallet', () => {
    let wallet, privateKey
    beforeAll(async () => {
      privateKey = await getSolPrivateKeyFromPlebbitPrivateKey(plebbitPrivateKey)
      const dateNow = Date.now
      Date.now = () => walletTimestamp * 1000
      wallet = await getSolWalletFromPlebbitPrivateKey(plebbitPrivateKey, authorAddress)
      Date.now = dateNow
    })

    test('getSolWalletFromPlebbitPrivateKey', async () => {
      expect(wallet.timestamp).toBe(walletTimestamp)
      expect(wallet.address).toBe('AzAfDLMxbptaq5Ppy4BK5aEsEzvTYNFAub5ffewbSdn9')
      expect(wallet.privateKey).toBe(undefined)
      expect(privateKey).toBe('44rJnvSKZwF6qMrc49MVe4KqcugR8zc8B4i1yo9iXrvKsf6FAFB7x1dSNdbAqqga4xvpU7VmnKRkwyvQWxrcBmGV')
      expect(wallet.signature.type).toBe('sol')
      expect(wallet.signature.signature).toBe('4A5VKfweqJMxj3mrFXDEgfxtQBJDYEgfg5BNKKaa7Aiq65ACC7rokBQXoRfBwERKRGQZryw8ZYrr9vuxnG8tnVnB')
    })

    test('validateSolWallet', async () => {
      // good signature
      await validateSolWallet(wallet, authorAddress)

      // bad signatures
      await expect(validateSolWallet({...wallet, timestamp: wallet.timestamp + 1}, authorAddress)).rejects.toThrow('signature invalid')
      await expect(validateSolWallet(wallet, 'invalidauthoraddress.eth')).rejects.toThrow('signature invalid')
      await expect(validateSolWallet({...wallet, timestamp: undefined}, authorAddress)).rejects.toThrow(
        `validateSolWallet invalid wallet.timestamp 'undefined' not a number`
      )
      await expect(validateSolWallet({...wallet, signature: undefined}, authorAddress)).rejects.toThrow(`validateSolWallet invalid wallet.signature 'undefined'`)
      await expect(validateSolWallet({...wallet, signature: {}}, authorAddress)).rejects.toThrow(`validateSolWallet invalid wallet.signature.signature 'undefined'`)
      await expect(validateSolWallet({...wallet, address: undefined}, authorAddress)).rejects.toThrow(`validateSolWallet invalid wallet.address 'undefined'`)
      await expect(validateSolWallet({...wallet, address: '11111111111111111111111111111111'}, authorAddress)).rejects.toThrow('signature invalid')
    })

    test('validateSolWallet fixture wallet', async () => {
      const authorAddress = '12D3KooWRLHxva6Mrt2fxuL4hMeGJCs8erHAAoXCzPGLsdLpdvrF'
      const wallet = {
        address: 'GWvoBSWefymBZ1pe4ktvXQnJAXEX97Sj2nuKVeBvjz8K',
        timestamp: 1758422293,
        signature: {
          signature: 'duY6oPos8RdH31EKaE86g4Lh5oqTL22tVHTG1kTEW8F4eHLG3ynFrP7xVvDm4pFCevKczbLcik8VmH6yZ8mgfx8',
          type: 'sol',
        },
      }
      await validateSolWallet(wallet, authorAddress)
    })
  })
})
