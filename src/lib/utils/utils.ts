import assert from 'assert'

const merge = (...args: any) => {
  // @ts-ignore
  const clonedArgs = args.map((arg) => {
    assert(arg && typeof arg === 'object', `utils.merge argument '${arg}' not an object`)
    return clone(arg)
  })
  const mergedObj: any = {}
  while (clonedArgs.length) {
    const currentArg = clonedArgs.shift()
    for (const i in currentArg) {
      if (currentArg[i] === undefined || currentArg[i] === null) {
        continue
      }
      mergedObj[i] = currentArg[i]
    }
  }
  return mergedObj
}

const clone = (obj: any) => {
  assert(obj && typeof obj === 'object', `utils.clone argument '${obj}' not an object`)
  let clonedObj: any = {}

  // clean the object to be cloned
  for (const i in obj) {
    // remove functions
    if (typeof obj[i] === 'function') {
      continue
    }
    // remove internal props
    if (i.startsWith('_')) {
      continue
    }
    if (obj[i] === undefined || obj[i] === null) {
      continue
    }
    // plebbit-js has a bug where plebbit instances have circular deps
    if (obj[i]?.constructor?.name === 'Plebbit') {
      continue
    }
    clonedObj[i] = obj[i]
  }

  // clone the object
  clonedObj = JSON.parse(JSON.stringify(clonedObj))
  return clonedObj
}

const sortTypes = [
  'hot',
  'new',
  'active',
  'old',
  'topHour',
  'topDay',
  'topWeek',
  'topMonth',
  'topYear',
  'topAll',
  'controversialHour',
  'controversialDay',
  'controversialWeek',
  'controversialMonth',
  'controversialYear',
  'controversialAll',
]

// this function should not clone the comments to not waste memory
export const flattenCommentsPages = (pageInstanceOrPagesInstance: any) => {
  const flattenedComments = []

  // if is a Page instance
  for (const comment of pageInstanceOrPagesInstance?.comments || []) {
    flattenedComments.push(comment)
    for (const sortType of sortTypes) {
      if (comment?.replies?.pages?.[sortType]) {
        flattenedComments.push(...flattenCommentsPages(comment.replies?.pages?.[sortType]))
      }
    }
  }

  // if is a Pages instance
  for (const sortType of sortTypes) {
    if (pageInstanceOrPagesInstance?.pages?.[sortType]) {
      flattenedComments.push(...flattenCommentsPages(pageInstanceOrPagesInstance.pages[sortType]))
    }
  }

  // if is a Pages.pages instance
  for (const sortType of sortTypes) {
    if (pageInstanceOrPagesInstance?.[sortType]) {
      flattenedComments.push(...flattenCommentsPages(pageInstanceOrPagesInstance[sortType]))
    }
  }

  // remove duplicate comments
  const flattenedCommentsObject = {}
  for (const comment of flattenedComments) {
    // @ts-ignore
    flattenedCommentsObject[comment.cid] = comment
  }
  const uniqueFlattened = []
  for (const cid in flattenedCommentsObject) {
    // @ts-ignore
    uniqueFlattened.push(flattenedCommentsObject[cid])
  }
  return uniqueFlattened
}

// define for typescript
const retryInfinityType = (f: any): any => {}

const utils = {
  merge,
  clone,
  flattenCommentsPages,
  // define for typescript
  retryInfinity: retryInfinityType,
  // export timeout values to mock them in tests
  retryInfinityMinTimeout: 1000,
  retryInfinityMaxTimeout: 1000 * 60 * 60 * 24,
}

export const retryInfinity = async (functionToRetry: any) => {
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
  let attempt = 0
  while (true) {
    try {
      const res = await functionToRetry()
      return res
    } catch (e) {
      const factor = 2
      let timeout = Math.round(utils.retryInfinityMinTimeout * Math.pow(factor, attempt++))
      timeout = Math.min(timeout, utils.retryInfinityMaxTimeout)
      await sleep(timeout)
    }
  }
}
utils.retryInfinity = retryInfinity

export default utils
