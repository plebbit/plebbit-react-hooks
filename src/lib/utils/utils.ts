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
  const clonedObj: any = {}
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
  return JSON.parse(JSON.stringify(clonedObj))
}

const sortTypes = [
  'hot',
  'new',
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

const utils = {
  merge,
  clone,
  flattenCommentsPages,
}

export default utils
