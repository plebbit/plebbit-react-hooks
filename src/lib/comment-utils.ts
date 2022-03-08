import assert from 'assert'

const merge = (...args: any) => {
  // @ts-ignore
  const clonedArgs = args.map((arg) => {
    assert(arg && typeof arg === 'object', `commentUtils.merge comment '${arg}' not an object`)
    return clone(arg)
  })
  const mergedComment: any = {}
  while (clonedArgs.length) {
    const currentArg = clonedArgs.shift()
    for (const i in currentArg) {
      if (currentArg[i] === undefined || currentArg[i] === null) {
        continue
      }
      mergedComment[i] = currentArg[i]
    }
  }
  return mergedComment
}

const clone = (comment: any) => {
  assert(comment && typeof comment === 'object', `commentUtils.clone comment '${comment}' not an object`)
  const clonedComment: any = {}
  for (const i in comment) {
    if (typeof comment[i] === 'function') {
      continue
    }
    if (i.startsWith('_')) {
      continue
    }
    if (comment[i] === undefined || comment[i] === null) {
      continue
    }
    clonedComment[i] = comment[i]
  }
  return JSON.parse(JSON.stringify(clonedComment))
}

const commentUtils = {
  merge,
  clone
}

export default commentUtils
