import {Account, Role, Subplebbits, AccountsComments, CommentCidsToAccountsComments} from '../../types'
import assert from 'assert'
import Logger from '@plebbit/plebbit-logger'
const log = Logger('plebbit-react-hooks:accounts:stores')

const getAuthorAddressRolesFromSubplebbits = (authorAddress: string, subplebbits: Subplebbits) => {
  const roles: {[subplebbitAddress: string]: Role} = {}
  for (const subplebbitAddress in subplebbits) {
    const role = subplebbits[subplebbitAddress]?.roles?.[authorAddress]
    if (role) {
      roles[subplebbitAddress] = role
    }
  }
  return roles
}

export const getAccountSubplebbits = (account: Account, subplebbits: Subplebbits) => {
  assert(
    account?.author?.address && typeof account?.author?.address === 'string',
    `accountsStore utils getAccountSubplebbits invalid account.author.address '${account?.author?.address}'`,
  )
  assert(subplebbits && typeof subplebbits === 'object', `accountsStore utils getAccountSubplebbits invalid subplebbits '${subplebbits}'`)

  const roles = getAuthorAddressRolesFromSubplebbits(account.author.address, subplebbits)
  const accountSubplebbits = {...account.subplebbits}
  for (const subplebbitAddress in roles) {
    accountSubplebbits[subplebbitAddress] = {...accountSubplebbits[subplebbitAddress]}
    accountSubplebbits[subplebbitAddress].role = roles[subplebbitAddress]
  }
  return accountSubplebbits
}

export const getCommentCidsToAccountsComments = (accountsComments: AccountsComments) => {
  const commentCidsToAccountsComments: CommentCidsToAccountsComments = {}
  for (const accountId in accountsComments) {
    for (const accountComment of accountsComments[accountId]) {
      if (accountComment.cid) {
        commentCidsToAccountsComments[accountComment.cid] = {accountId, accountCommentIndex: accountComment.index}
      }
    }
  }
  return commentCidsToAccountsComments
}

export const fetchCommentLinkDimensions = async (link: string) => {
  const fetchImageDimensions = (url: string) =>
    new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => {
        const dimensions = {
          width: image.width,
          height: image.height,
        }
        resolve(dimensions)
      }
      image.onerror = (error) => {
        reject(Error(`failed fetching image dimensions for url '${url}'`))
      }

      // max loading time
      const timeout = 10000
      setTimeout(() => reject(Error(`failed fetching image dimensions for url '${url}' timeout '${timeout}'`)), timeout)

      // start loading
      image.src = url
    })

  const fetchVideoDimensions = (url: string) =>
    new Promise((resolve, reject) => {
      const video = document.createElement('video')
      video.muted = true
      video.loop = false
      video.addEventListener('loadeddata', () => {
        const dimensions = {
          width: video.videoWidth,
          height: video.videoHeight,
        }
        resolve(dimensions)
        // prevent video from playing
        try {
          video.pause()
        } catch (e) {}
        // prevent video from loading
        try {
          video.src = ''
        } catch (e) {}
      })
      video.addEventListener('error', (error) => {
        reject(Error(`failed fetching video dimensions for url '${url}'`))
      })

      // max loading time
      const timeout = 30000
      setTimeout(() => reject(Error(`failed fetching video dimensions for url '${url}' timeout '${timeout}'`)), timeout)

      // start loading
      video.src = url
    })

  if (link) {
    try {
      if (new URL(link).protocol !== 'https:') {
        throw Error(`failed fetching comment.link dimensions for link '${link}' not https protocol`)
      }
      const dimensions: any = await Promise.race([fetchImageDimensions(link), fetchVideoDimensions(link)])
      return {
        linkWidth: dimensions.width,
        linkHeight: dimensions.height,
      }
    } catch (error: any) {
      log.error('fetchCommentLinkDimensions error', {error, link})
    }
  }
  return {}
}

const utils = {
  getAccountSubplebbits,
  getCommentCidsToAccountsComments,
  fetchCommentLinkDimensions,
}

export default utils
