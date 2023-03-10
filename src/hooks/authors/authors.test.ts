import {act, renderHook} from '@testing-library/react-hooks'
import testUtils from '../../lib/test-utils'
import {useAuthorAvatar, useResolvedAuthorAddress, setPlebbitJs, useAccount} from '../..'
import {resolveAuthorAddress} from './authors'
import {useNftMetadataUrl, useNftImageUrl, useVerifiedAuthorAvatarSignature, verifyAuthorAvatarSignature} from './author-avatars'
import localForageLru from '../../lib/localforage-lru'
import PlebbitJsMock from '../../lib/plebbit-js/plebbit-js-mock'
import {ethers} from 'ethers'
import {Nft, Author} from '../../types'
setPlebbitJs(PlebbitJsMock)

const avatarNft1 = {
  chainTicker: 'eth',
  address: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d', // the contract address of the nft
  id: '100', // the nft number 100 in the colletion
}
const avatarNft2 = {
  chainTicker: 'matic',
  address: '0xf6d8e606c862143556b342149a7fe0558c220375', // the contract address of the nft
  id: '100', // the nft number 100 in the colletion
}
const avatarNftImageUrl1 = 'https://cloudflare-ipfs.com/ipfs/QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/100'
const avatarNftImageUrl2 = 'https://peer.decentraland.org/lambdas/collections/standard/erc721/137/0xf6d8e606c862143556b342149a7fe0558c220375/0/100'
const authorAddress = 'Qm...'

describe('authors', () => {
  let author: Author

  beforeAll(async () => {
    testUtils.silenceUpdateUnmountedComponentWarning()
    author = {
      address: authorAddress,
      avatar: {
        ...avatarNft1,
        signature: {
          signature: await createAuthorAvatarSignature(avatarNft1, authorAddress),
        },
      },
    }
  })

  afterAll(() => {
    testUtils.restoreAll()
  })

  describe('author avatar', () => {
    const timeout = 30000
    jest.setTimeout(timeout)

    // skip because uses internet and not deterministic
    test.skip('useNftImageUrl', async () => {
      const rendered = renderHook<any, any>((nft) => {
        const {metadataUrl} = useNftMetadataUrl(nft)
        return useNftImageUrl(metadataUrl)
      })
      const waitFor = testUtils.createWaitFor(rendered, {timeout})
      expect(rendered.result.current).toEqual({error: undefined, imageUrl: undefined})

      // test eth network
      rendered.rerender(avatarNft1)
      await waitFor(() => typeof rendered.result.current.imageUrl === 'string')
      expect(rendered.result.current.imageUrl).toBe(avatarNftImageUrl1)

      // test polygon network
      rendered.rerender(avatarNft2)
      await waitFor(() => typeof rendered.result.current.imageUrl === 'string' && rendered.result.current.imageUrl !== avatarNftImageUrl1)
      expect(rendered.result.current.imageUrl).toBe(avatarNftImageUrl2)
    })

    // skip because uses internet and not deterministic
    test.skip('useVerifiedAuthorAvatarSignature', async () => {
      const rendered = renderHook<any, any>((author) => useVerifiedAuthorAvatarSignature(author))
      const waitFor = testUtils.createWaitFor(rendered, {timeout})
      expect(rendered.result.current).toEqual({verified: undefined, error: undefined})

      // test eth network
      rendered.rerender(author)
      await waitFor(() => rendered.result.current.verified === false)
      expect(rendered.result.current.verified).toBe(false)
    })

    // skip because uses internet and not deterministic
    test.skip('useAuthorAvatar', async () => {
      const rendered = renderHook<any, any>((author) => useAuthorAvatar({author}))
      const waitFor = testUtils.createWaitFor(rendered, {timeout})
      expect(rendered.result.current.imageUrl).toBe(undefined)

      rendered.rerender(author)
      // NOTE: waitFor expected to fail because our test signer doesn't own the nft
      // manually check the logs to see if it actually works on not
      await waitFor(() => typeof rendered.result.current.imageUrl === 'string')
      console.log(rendered.result.current)
      expect(rendered.result.current).toBe(undefined)
    })

    // skip because uses internet and not deterministic
    test.skip('useAuthorAvatar with ENS', async () => {
      const author = {
        displayName: 'Esteban Abaroa',
        address: 'estebanabaroa.eth',
        avatar: {
          chainTicker: 'matic',
          address: '0x890a2e81836e0e76e0f49995e6b51ca6ce6f39ed',
          id: '105',
          signature: {
            signature: '0xcb73c6b96193684ecea48952facbc217b3438c5e9290d978d40f227e3663eaf765d7f19f96151c35115deadee8003060352ffef1e6cc2e0600062e98c1e298301b',
            type: 'eip191',
            signedPropertyNames: ['domainSeparator', 'authorAddress', 'tokenAddress', 'tokenId'],
          },
        },
      }
      const rendered = renderHook<any, any>((author) => useAuthorAvatar({author}))
      const waitFor = testUtils.createWaitFor(rendered, {timeout})
      expect(rendered.result.current.imageUrl).toBe(undefined)

      rendered.rerender(author)
      await waitFor(() => typeof rendered.result.current.imageUrl === 'string')
      expect(rendered.result.current.imageUrl).toBe('https://cloudflare-ipfs.com/ipfs/QmbzsdEuX7Wnw3fEcue9siszymd94GRy6XMNDGkbUbVhTL')
    })
  })

  describe('author address', () => {
    const timeout = 60000
    jest.setTimeout(timeout)

    // skip because uses internet and not deterministic
    test.skip('useResolvedAuthorAddress', async () => {
      const rendered = renderHook<any, any>((author) => useResolvedAuthorAddress({author}))
      const waitFor = testUtils.createWaitFor(rendered, {timeout})
      expect(rendered.result.current.resolvedAddress).toBe(undefined)

      rendered.rerender({address: 'plebbit.eth'})
      await waitFor(() => typeof rendered.result.current.resolvedAddress === 'string')
      expect(rendered.result.current.resolvedAddress).toBe('QmX18Ls7iss1BLXYjZqP5faFoXih7YYSUkADdATHxiXmnu')
    })

    test('useResolvedAuthorAddress unsupported crypto domain', async () => {
      const rendered = renderHook<any, any>((author) => useResolvedAuthorAddress({author}))
      const waitFor = testUtils.createWaitFor(rendered)
      expect(rendered.result.current.resolvedAddress).toBe(undefined)

      rendered.rerender({address: 'plebbit.com'})
      await waitFor(() => rendered.result.current.error)
      expect(rendered.result.current.error.message).toBe('crypto domain type unsupported')
    })

    test('useResolvedAuthorAddress not a crypto domain', async () => {
      const rendered = renderHook<any, any>((author) => useResolvedAuthorAddress({author}))
      const waitFor = testUtils.createWaitFor(rendered)
      expect(rendered.result.current.resolvedAddress).toBe(undefined)

      rendered.rerender({address: 'abc'})
      await waitFor(() => rendered.result.current.error)
      expect(rendered.result.current.error.message).toBe('not a crypto domain')
    })
  })
})

const createAuthorAvatarSignature = async (nft: Nft, authorAddress: string) => {
  const testPrivateKey = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
  const ethersJsSigner = new ethers.Wallet(Buffer.from(testPrivateKey, 'hex'))

  let messageToSign: any = {}
  // the property names must be in this order for the signature to match
  // insert props one at a time otherwise babel/webpack will reorder
  messageToSign.domainSeparator = 'plebbit-author-avatar'
  messageToSign.tokenAddress = nft.address
  messageToSign.tokenId = nft.id
  messageToSign.authorAddress = authorAddress
  // use plain JSON so the user can read what he's signing
  messageToSign = JSON.stringify(messageToSign)

  // the ethers.js signer is usually gotten from metamask https://docs.ethers.io/v5/api/signer/
  const signature = await ethersJsSigner.signMessage(messageToSign)
  return signature
}
