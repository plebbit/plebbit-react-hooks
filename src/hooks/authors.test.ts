import {act, renderHook} from '@testing-library/react-hooks'
import testUtils from '../lib/test-utils'
import {useAuthorAvatarImageUrl, useResolvedAuthorAddress, PlebbitProvider, setPlebbitJs, useAccount} from '..'
import {useNftImageUrl, useVerifiedAuthorAvatarSignature, verifyAuthorAvatarSignature, resolveAuthorAddress} from './authors'
import localForageLru from '../lib/localforage-lru'
import PlebbitJsMock from '../lib/plebbit-js/plebbit-js-mock'
import {ethers} from 'ethers'
import {Nft, Author} from '../types'
setPlebbitJs(PlebbitJsMock)

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
        signature: await createAuthorAvatarSignature(avatarNft1, authorAddress),
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
      const rendered = renderHook<any, any>((nft) => useNftImageUrl(nft), {wrapper: PlebbitProvider})
      const waitFor = testUtils.createWaitFor(rendered, {timeout})
      expect(rendered.result.current).toBe(undefined)

      // test eth network
      rendered.rerender(avatarNft1)
      await waitFor(() => typeof rendered.result.current === 'string')
      expect(rendered.result.current).toBe(avatarNftImageUrl1)

      // test polygon network
      rendered.rerender(avatarNft2)
      await waitFor(() => typeof rendered.result.current === 'string' && rendered.result.current !== avatarNftImageUrl1)
      expect(rendered.result.current).toBe(avatarNftImageUrl2)
    })

    // skip because uses internet and not deterministic
    test.skip('useVerifiedAuthorAvatarSignature', async () => {
      const rendered = renderHook<any, any>((author) => useVerifiedAuthorAvatarSignature(author), {wrapper: PlebbitProvider})
      const waitFor = testUtils.createWaitFor(rendered, {timeout})
      expect(rendered.result.current).toBe(undefined)

      // test eth network
      rendered.rerender(author)
      await waitFor(() => rendered.result.current === false)
      expect(rendered.result.current).toBe(false)
    })

    // skip because uses internet and not deterministic
    // also cache and pending is difficult to test without console logging it
    test.skip('verifyAuthorAvatarSignature (cache and pending)', async () => {
      const rendered = renderHook<any, any>(() => useAccount(), {wrapper: PlebbitProvider})
      const waitFor = testUtils.createWaitFor(rendered, {timeout})
      await waitFor(() => rendered.result.current)
      expect(rendered.result.current).not.toBe(undefined)
      console.log(rendered.result.current)
      const blockchainProviders = rendered.result.current?.plebbitOptions?.blockchainProviders

      // const verified = await verifyAuthorAvatarSignature(author.avatar, author.address, blockchainProviders)
      // console.log(verified)
      // const cachedVerified = await verifyAuthorAvatarSignature(author.avatar, author.address, blockchainProviders)
      // console.log(cachedVerified)

      const res = await Promise.all([
        verifyAuthorAvatarSignature(author.avatar, author.address, blockchainProviders),
        verifyAuthorAvatarSignature(author.avatar, author.address, blockchainProviders),
      ])
      console.log(res)
    })

    // skip because uses internet and not deterministic
    test.skip('useAuthorAvatarImageUrl', async () => {
      const rendered = renderHook<any, any>((author) => useAuthorAvatarImageUrl(author), {wrapper: PlebbitProvider})
      const waitFor = testUtils.createWaitFor(rendered, {timeout})
      expect(rendered.result.current).toBe(undefined)

      rendered.rerender(author)
      // NOTE: waitFor expected to fail because our test signer doesn't own the nft
      // manually check the logs to see if it actually works on not
      await waitFor(() => typeof rendered.result.current === 'string')
      expect(rendered.result.current).toBe(undefined)
    })

    // skip because uses internet and not deterministic
    test.skip('useAuthorAvatarImageUrl with ENS', async () => {
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
      const rendered = renderHook<any, any>((author) => useAuthorAvatarImageUrl(author), {wrapper: PlebbitProvider})
      const waitFor = testUtils.createWaitFor(rendered, {timeout})
      expect(rendered.result.current).toBe(undefined)

      rendered.rerender(author)
      await waitFor(() => typeof rendered.result.current === 'string')
      expect(rendered.result.current).toBe('https://cloudflare-ipfs.com/ipfs/Qmakn3p9v7EBo2VXkPitPqPMVzdZ1wpghaF5fPCHg1nePa/105')
    })
  })

  describe('author address', () => {
    const timeout = 60000
    jest.setTimeout(timeout)

    // skip because uses internet and not deterministic
    test.skip('useResolvedAuthorAddress', async () => {
      const rendered = renderHook<any, any>((authorAddress) => useResolvedAuthorAddress(authorAddress), {wrapper: PlebbitProvider})
      const waitFor = testUtils.createWaitFor(rendered, {timeout})
      expect(rendered.result.current).toBe(undefined)

      rendered.rerender('plebbit.eth')
      await waitFor(() => typeof rendered.result.current === 'string')
      expect(rendered.result.current).toBe('QmX18Ls7iss1BLXYjZqP5faFoXih7YYSUkADdATHxiXmnu')
    })

    // skip because uses internet and not deterministic
    // also cache and pending is difficult to test without console logging it
    test.skip('resolveAuthorAddress (cache and pending)', async () => {
      const rendered = renderHook<any, any>(() => useAccount(), {wrapper: PlebbitProvider})
      const waitFor = testUtils.createWaitFor(rendered, {timeout})
      await waitFor(() => rendered.result.current)
      expect(rendered.result.current).not.toBe(undefined)
      console.log(rendered.result.current)
      const blockchainProviders = rendered.result.current?.plebbitOptions?.blockchainProviders

      // const res = await resolveAuthorAddress('plebbit.eth', blockchainProviders)
      // console.log(res)
      // const cachedRes = await resolveAuthorAddress('plebbit.eth', blockchainProviders)
      // console.log(cachedRes)

      const res = await Promise.all([resolveAuthorAddress('plebbit.eth', blockchainProviders), resolveAuthorAddress('plebbit.eth', blockchainProviders)])
      console.log(res)
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
