import assert from 'assert'
import {Feed, Feeds, Subplebbits, Account, FeedsOptions, SubplebbitPage} from '../../types'

export const getBufferedFeeds = () => {
  return {}
}

export const getLoadedFeeds = () => {
  return {}
}

export const getBufferedPostsCounts = () => {
  return {}
}

// get all subplebbits pages cids of all feeds, use to check if a subplebbitsStore change should trigger updateFeeds
export const getFeedsSubplebbitsFirstPageCids = (feedsOptions: FeedsOptions, subplebbits: Subplebbits): string[] => {
  // find all feeds subplebbits
  const feedNames = Object.keys(feedsOptions)
  const feedsSubplebbitAddresses = new Set<string>()
  Object.keys(feedsOptions).forEach((i) => feedsOptions[i].subplebbitAddresses.forEach((a) => feedsSubplebbitAddresses.add(a)))

  // find all the feeds subplebbits first page cids
  const feedsSubplebbitsFirstPageCids = new Set<string>()
  for (const subplebbitAddress of feedsSubplebbitAddresses) {
    const subplebbit = subplebbits[subplebbitAddress]
    if (!subplebbit?.posts) {
      continue
    }

    // check pages
    if (subplebbit.posts.pages) {
      for (const page of Object.values<SubplebbitPage>(subplebbit.posts.pages)) {
        if (page?.nextCid) {
          feedsSubplebbitsFirstPageCids.add(page?.nextCid)
        }
      }
    }

    // check pageCids
    if (subplebbit.posts.pageCids) {
      for (const pageCid of Object.values<string>(subplebbit.posts.pageCids)) {
        if (pageCid) {
          feedsSubplebbitsFirstPageCids.add(pageCid)
        }
      }
    }
  }

  return [...feedsSubplebbitsFirstPageCids].sort()
}
