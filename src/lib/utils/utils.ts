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
export const flattenSortedComments = (sortedCommentsOrSortedCommentsObject: any) => {
  const flattenedComments = []

  // if is SortedComments
  for (const reply of sortedCommentsOrSortedCommentsObject?.comments || []) {
    flattenedComments.push(reply)
    for (const sortType of sortTypes) {
      if (reply?.sortedReplies?.[sortType]) {
        flattenedComments.push(...flattenSortedComments(reply.sortedReplies[sortType]))
      }
    }
  }

  // if is SortedCommentsObject
  for (const sortType of sortTypes) {
    if (sortedCommentsOrSortedCommentsObject?.[sortType]) {
      flattenedComments.push(...flattenSortedComments(sortedCommentsOrSortedCommentsObject[sortType]))
    }
  }

  // remove duplicate comments
  const flattenedCommentsObject = {}
  for (const reply of flattenedComments) {
    // @ts-ignore
    flattenedCommentsObject[reply.cid] = reply
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
  flattenSortedComments,
}

export default utils
