import {act, renderHook} from '@testing-library/react-hooks'
import testUtils from '../../lib/test-utils'
import {useAuthor, useAuthorComments, useAuthorAvatar, useResolvedAuthorAddress, setPlebbitJs, useAccount} from '../..'
import {commentsPerPage} from '../../stores/authors-comments'
import {useNftMetadataUrl, useNftImageUrl, useVerifiedAuthorAvatarSignature, verifyAuthorAvatarSignature} from './author-avatars'
import localForageLru from '../../lib/localforage-lru'
import {ethers} from 'ethers'
import {Nft, Author} from '../../types'
import PlebbitJsMock, {Plebbit} from '../../lib/plebbit-js/plebbit-js-mock'
setPlebbitJs(PlebbitJsMock)

const avatarNft1 = {
  chainTicker: 'eth',
  address: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d', // the contract address of the nft
  id: '100', // the nft number 100 in the colletion
  timestamp: Math.ceil(Date.now() / 1000),
}
const avatarNft2 = {
  chainTicker: 'matic',
  address: '0xf6d8e606c862143556b342149a7fe0558c220375', // the contract address of the nft
  id: '100', // the nft number 100 in the colletion
  timestamp: Math.ceil(Date.now() / 1000),
}
const avatarNftImageUrl1 = 'https://cloudflare-ipfs.com/ipfs/QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/100'
const avatarNftImageUrl2 = 'https://peer.decentraland.org/lambdas/collections/standard/erc721/137/0xf6d8e606c862143556b342149a7fe0558c220375/0/100'
const authorAddress = '12D3KooW...'

describe('authors', () => {
  let author: Author

  beforeAll(async () => {
    testUtils.silenceReactWarnings()
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

  describe('useAuthorComments', () => {
    let rendered: any, waitFor: any

    beforeEach(async () => {
      rendered = renderHook<any, any>((options: any) => {
        const useAuthorCommentsResult = useAuthorComments(options)
        return useAuthorCommentsResult
      })
      // fetching multiple pages is slow, needs high timeout
      waitFor = testUtils.createWaitFor(rendered, {timeout: 5000})
    })

    afterEach(async () => {
      await testUtils.resetDatabasesAndStores()

      // wait and reset comments store again, for some reason it is needed sometimes or
      // comments from a previous test will be in the comments store, don't know why
      await new Promise((r) => setTimeout(r, 50))
      await testUtils.resetDatabasesAndStores()
    })

    test('no comment cid', async () => {
      rendered.rerender({authorAddress: 'author.eth'})
      await waitFor(() => rendered.result.current.state === 'failed')
      expect(rendered.result.current.state).toBe('failed')
      expect(rendered.result.current.error.message).toBe('missing UseAuthorOptions.commentCid')
    })

    test('no author address', async () => {
      rendered.rerender({commentCid: 'comment cid'})
      await waitFor(() => rendered.result.current.state === 'failed')
      expect(rendered.result.current.state).toBe('failed')
      expect(rendered.result.current.error.message).toBe('missing UseAuthorOptions.authorAddress')
    })

    test('comment cid from different author', async () => {
      rendered.rerender({commentCid: 'comment cid', authorAddress: 'different-author.eth'})

      // expect to fail because plebbit-js mock content doesnt have author address 'different-author.eth'
      await waitFor(() => rendered.result.current.state === 'failed')
      expect(rendered.result.current.state).toBe('failed')
      expect(rendered.result.current.error.message).toBe('commentCid author.address is different from authorAddress')
    })

    test('get multiple pages until no more previous comment', async () => {
      // mock the correct author address on the comment
      const commentToGet = Plebbit.prototype.commentToGet
      // the author only has 110 comments
      const authorCommentsCount = 110
      let previousCommentCount = 0
      const getAuthorPreviousCommentCid = () => {
        if (previousCommentCount < authorCommentsCount - 1) {
          return `previous comment cid ${++previousCommentCount}`
        }
      }
      Plebbit.prototype.commentToGet = (commentCid) => {
        // ignore other comments used for testing changing useAuthorsOptions
        if (commentCid?.startsWith('other comment')) {
          return {}
        }
        return {
          author: {
            address: 'author.eth',
            previousCommentCid: getAuthorPreviousCommentCid(),
          },
        }
      }

      // get 1st page (25 comments, 75 buffered)
      rendered.rerender({commentCid: 'comment cid', authorAddress: 'author.eth'})
      await waitFor(() => rendered.result.current.authorComments.length === commentsPerPage)
      expect(rendered.result.current.authorComments.length).toBe(commentsPerPage)
      expect(rendered.result.current.hasMore).toBe(true)
      // first comment should be the commentCid argument
      expect(rendered.result.current.authorComments[0].cid).toBe('comment cid')

      // get 2nd page (50 comments, 100 buffered)
      await act(async () => {
        await rendered.result.current.loadMore()
      })
      await waitFor(() => rendered.result.current.authorComments.length === commentsPerPage * 2)
      expect(rendered.result.current.authorComments.length).toBe(commentsPerPage * 2)
      expect(rendered.result.current.hasMore).toBe(true)

      // get 3rd page (75 comments, 110 buffered (author only has 110 comments))
      await act(async () => {
        await rendered.result.current.loadMore()
      })
      await waitFor(() => rendered.result.current.authorComments.length === commentsPerPage * 3)
      expect(rendered.result.current.authorComments.length).toBe(commentsPerPage * 3)
      expect(rendered.result.current.hasMore).toBe(true)

      // change commentCid to lastCommentCid, should do nothing
      rendered.rerender({commentCid: 'other comment cid', authorAddress: 'author.eth'})
      await new Promise((r) => setTimeout(r, 500))
      expect(rendered.result.current.authorComments.length).toBe(commentsPerPage * 3)
      expect(rendered.result.current.hasMore).toBe(true)

      // change authorAddress, should reset authorComments to 0
      rendered.rerender({commentCid: 'other comment cid 2', authorAddress: 'other-author.eth'})
      await waitFor(() => rendered.result.current.authorComments.length === 0)
      expect(rendered.result.current.authorComments.length).toBe(0)
      expect(rendered.result.current.hasMore).toBe(true)

      // change back to original authorAddress, should get all previous pages loaded
      rendered.rerender({commentCid: 'other comment cid 3', authorAddress: 'author.eth'})
      await waitFor(() => rendered.result.current.authorComments.length === commentsPerPage * 3)
      expect(rendered.result.current.authorComments.length).toBe(commentsPerPage * 3)
      expect(rendered.result.current.hasMore).toBe(true)

      // get 4th page (100 comments, 110 buffered (author only has 110 comments))
      await act(async () => {
        await rendered.result.current.loadMore()
      })
      await waitFor(() => rendered.result.current.authorComments.length === commentsPerPage * 4)
      expect(rendered.result.current.authorComments.length).toBe(commentsPerPage * 4)
      expect(rendered.result.current.hasMore).toBe(true)

      // get 5th (last) page (110 comments, 110 buffered (author only has 110 comments))
      await act(async () => {
        await rendered.result.current.loadMore()
      })
      await waitFor(() => rendered.result.current.authorComments.length === 110 && rendered.result.current.hasMore === false)
      expect(rendered.result.current.authorComments.length).toBe(110)
      expect(rendered.result.current.hasMore).toBe(false)

      // restore mock
      Plebbit.prototype.commentToGet = commentToGet
    })

    test('find more recent lastCommentCid while scrolling', async () => {
      // mock the correct author address on the comment
      const commentToGet = Plebbit.prototype.commentToGet
      let previousCommentCount = 0
      const getAuthorPreviousCommentCid = () => `previous comment cid ${++previousCommentCount}`
      const getTimestamp = (commentCid?: string) => {
        // last comment must be newer than all other comments
        // to be added to lastCommentCid
        if (commentCid === 'last comment cid') {
          return 1000
        }
        return 1000 - (previousCommentCount + 1)
      }
      Plebbit.prototype.commentToGet = (commentCid?: string) => ({
        timestamp: getTimestamp(commentCid),
        author: {
          address: 'author.eth',
          previousCommentCid: getAuthorPreviousCommentCid(),
          subplebbit: {
            lastCommentCid: 'last comment cid',
          },
        },
      })

      // get 1st page
      rendered.rerender({commentCid: 'comment cid', authorAddress: 'author.eth'})
      await waitFor(() => rendered.result.current.authorComments.length === commentsPerPage)
      expect(rendered.result.current.authorComments.length).toBe(commentsPerPage)
      expect(rendered.result.current.hasMore).toBe(true)

      // has lastCommentCid
      await waitFor(() => rendered.result.current.lastCommentCid === 'last comment cid')
      expect(rendered.result.current.lastCommentCid).toBe('last comment cid')

      // restore mock
      Plebbit.prototype.commentToGet = commentToGet
    })

    test('some author comments have wrong author', async () => {
      // mock the correct author address on the comment
      const commentToGet = Plebbit.prototype.commentToGet
      // start giving a wrong author after this amount
      const wrongAuthorAfter = 40
      let previousCommentCount = 0
      const getAuthorPreviousCommentCid = () => `previous comment cid ${++previousCommentCount}`
      Plebbit.prototype.commentToGet = () => ({
        author: {
          address: previousCommentCount < wrongAuthorAfter ? 'author.eth' : 'wrong-author.eth',
          previousCommentCid: getAuthorPreviousCommentCid(),
        },
      })

      // get 1st page
      rendered.rerender({commentCid: 'comment cid', authorAddress: 'author.eth'})
      await waitFor(() => rendered.result.current.authorComments.length === commentsPerPage)
      expect(rendered.result.current.authorComments.length).toBe(commentsPerPage)
      await waitFor(() => rendered.result.current.hasMore === true)
      expect(rendered.result.current.hasMore).toBe(true)
      expect(rendered.result.current.error).toBe(undefined)

      // get 2nd page
      await act(async () => {
        await rendered.result.current.loadMore()
      })
      await waitFor(() => rendered.result.current.authorComments.length >= wrongAuthorAfter)
      // wait a bit more to make sure no comments load
      await new Promise((r) => setTimeout(r, 500))
      expect(rendered.result.current.authorComments.length).toBe(wrongAuthorAfter)
      // TODO: find a way to make hasMore false if previousComment has a wrong author.address
      // expect(rendered.result.current.hasMore).toBe(false)
      // TODO: find a way to add the error to result.error
      // expect(rendered.result.current.error.message).toBe('comment.author.previousCommentCid comment has different author address from authorAddress')

      // restore mock
      Plebbit.prototype.commentToGet = commentToGet
    })

    test('cannot spam load more', async () => {
      // mock the correct author address on the comment
      const commentToGet = Plebbit.prototype.commentToGet
      let previousCommentCount = 0
      const getAuthorPreviousCommentCid = () => `previous comment cid ${++previousCommentCount}`
      Plebbit.prototype.commentToGet = () => ({
        author: {
          address: 'author.eth',
          previousCommentCid: getAuthorPreviousCommentCid(),
        },
      })

      // wait for first page to load
      rendered.rerender({commentCid: 'comment cid', authorAddress: 'author.eth'})

      // spam loadMore, never get more than just the second page
      await act(async () => {
        rendered.result.current.loadMore()
        rendered.result.current.loadMore()
        rendered.result.current.loadMore()
        rendered.result.current.loadMore()
        rendered.result.current.loadMore()
      })

      await waitFor(() => rendered.result.current.authorComments.length === 25)
      // wait a bit more to make sure no other page load
      await new Promise((r) => setTimeout(r, 500))
      // page 2, spamming loadMore should not load more than page 2
      expect(rendered.result.current.authorComments.length).toBe(25)
      expect(rendered.result.current.hasMore).toBe(true)

      // restore mock
      Plebbit.prototype.commentToGet = commentToGet
    })

    test('has no previous comment cid, get only comment cid provided', async () => {
      // mock the correct author address on the comment
      const commentToGet = Plebbit.prototype.commentToGet
      Plebbit.prototype.commentToGet = () => ({author: {address: 'author.eth', previousCommentCid: undefined}})

      rendered.rerender({commentCid: 'comment cid', authorAddress: 'author.eth'})
      await waitFor(() => rendered.result.current.authorComments.length === 1)
      expect(rendered.result.current.authorComments.length).toBe(1)
      expect(rendered.result.current.lastCommentCid).toBe(undefined)
      expect(rendered.result.current.state).toBe('succeeded')
      expect(rendered.result.current.hasMore).toBe(false)

      // restore mock
      Plebbit.prototype.commentToGet = commentToGet
    })
  })

  describe('useAuthor', () => {
    let rendered: any, waitFor: any

    beforeEach(async () => {
      rendered = renderHook<any, any>((options: any) => {
        const useAuthorResult = useAuthor(options)
        return useAuthorResult
      })
      waitFor = testUtils.createWaitFor(rendered)
    })

    afterEach(async () => {
      await testUtils.resetDatabasesAndStores()
    })

    test('no comment cid', async () => {
      rendered.rerender({authorAddress: 'author.eth'})
      await waitFor(() => rendered.result.current.state === 'failed')
      expect(rendered.result.current.state).toBe('failed')
      expect(rendered.result.current.error.message).toBe('missing UseAuthorOptions.commentCid')
    })

    test('no author address', async () => {
      rendered.rerender({commentCid: 'comment cid'})
      await waitFor(() => rendered.result.current.state === 'failed')
      expect(rendered.result.current.state).toBe('failed')
      expect(rendered.result.current.error.message).toBe('missing UseAuthorOptions.authorAddress')
    })

    test('comment cid from different author', async () => {
      rendered.rerender({commentCid: 'comment cid', authorAddress: 'different-author.eth'})

      // expect to fail because plebbit-js mock content doesnt have author address 'different-author.eth'
      await waitFor(() => rendered.result.current.state === 'failed')
      expect(rendered.result.current.state).toBe('failed')
      expect(rendered.result.current.error.message).toBe('commentCid author.address is different from authorAddress')
    })

    test('succeeded', async () => {
      // mock the correct author address on the comment
      const commentToGet = Plebbit.prototype.commentToGet
      Plebbit.prototype.commentToGet = () => ({
        author: {
          address: 'author.eth',
          displayName: 'display name',
        },
      })

      rendered.rerender({commentCid: 'comment cid', authorAddress: 'author.eth'})
      await waitFor(() => rendered.result.current.state === 'succeeded')
      expect(rendered.result.current.state).toBe('succeeded')
      expect(rendered.result.current.error).toBe(undefined)
      expect(rendered.result.current.author?.address).toBe('author.eth')
      expect(rendered.result.current.author?.displayName).toBe('display name')

      // can reset
      rendered.rerender({})
      await waitFor(() => rendered.result.current.author === undefined)
      expect(rendered.result.current.author).toBe(undefined)
      rendered.rerender({commentCid: 'comment cid', authorAddress: 'author.eth'})
      await waitFor(() => rendered.result.current.state === 'succeeded')
      expect(rendered.result.current.state).toBe('succeeded')

      // restore mock
      Plebbit.prototype.commentToGet = commentToGet
    })
  })

  describe('author avatar', () => {
    const timeout = 30000
    jest.setTimeout(timeout)

    test('useAuthorAvatar avatar has no signature', async () => {
      const author = {
        address: authorAddress,
        avatar: {
          ...avatarNft1,
          signature: undefined,
        },
      }
      const rendered = renderHook<any, any>((author) => useAuthorAvatar({author}))
      const waitFor = testUtils.createWaitFor(rendered, {timeout})
      expect(rendered.result.current.imageUrl).toBe(undefined)

      rendered.rerender(author)
      // NOTE: waitFor expected to fail because our test signer doesn't own the nft
      // manually check the logs to see if it actually works on not
      await waitFor(() => rendered.result.current.state === 'failed')
      expect(rendered.result.current.state).toBe('failed')
      expect(rendered.result.current.error.message.includes('invalid nft.signature')).toBe(true)
    })

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
  messageToSign.authorAddress = authorAddress
  messageToSign.timestamp = nft.timestamp
  messageToSign.tokenAddress = nft.address
  messageToSign.tokenId = nft.id
  // use plain JSON so the user can read what he's signing
  messageToSign = JSON.stringify(messageToSign)

  // the ethers.js signer is usually gotten from metamask https://docs.ethers.io/v5/api/signer/
  const signature = await ethersJsSigner.signMessage(messageToSign)
  return signature
}
