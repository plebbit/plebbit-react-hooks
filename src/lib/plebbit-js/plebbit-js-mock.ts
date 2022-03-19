import EventEmitter from 'events'
export { mockPlebbitJs as mockPlebbitJs } from '.'

// TODO: make load time changeable with env variable
// so the frontend can test with latency
const loadingTime = 10
export const simulateLoadingTime = () => new Promise((r) => setTimeout(r, loadingTime))

export class Plebbit {
  createSubplebbit(createSubplebbitOptions: any) {
    return new Subplebbit(createSubplebbitOptions)
  }

  async getSubplebbit(subplebbitAddress: string) {
    await simulateLoadingTime()
    const createSubplebbitOptions = {
      address: subplebbitAddress,
    }
    const subplebbit: any = new Subplebbit(createSubplebbitOptions)
    subplebbit.title = subplebbit.address + ' title'
    const hotPageCid = subplebbit.address + ' sorted posts cid hot'
    subplebbit.sortedPosts = { hot: subplebbitGetSortedPosts(hotPageCid, subplebbit) }
    subplebbit.pageCids = {
      hot: hotPageCid,
      topAll: subplebbit.address + ' sorted posts cid topAll',
      new: subplebbit.address + ' sorted posts cid new',
    }
    // mock properties of subplebbitToGet unto the subplebbit instance
    for (const prop in this.subplebbitToGet(subplebbit)) {
      subplebbit[prop] = this.subplebbitToGet(subplebbit)[prop]
    }
    return subplebbit
  }

  // mock this method to get a subplebbit with different title, posts, address, etc
  subplebbitToGet(subplebbit: any): any {
    return {
      // title: 'some title'
    }
  }

  createComment(createCommentOptions: any) {
    return new Comment(createCommentOptions)
  }

  async getComment(commentCid: string) {
    await simulateLoadingTime()
    const createCommentOptions = {
      cid: commentCid,
      ipnsName: commentCid + ' ipns name',
      ...this.commentToGet(),
    }
    return new Comment(createCommentOptions)
  }

  // mock this method to get a comment with different content, timestamp, address, etc
  commentToGet() {
    return {
      // content: 'mock some content'
      // author: {address: 'mock some address'},
      // timestamp: 1234
    }
  }

  createVote() {
    return new Vote()
  }
}

export class Subplebbit extends EventEmitter {
  updateCalledTimes = 0
  updating = false
  address: string | undefined
  title: string | undefined
  description: string | undefined
  sortedPosts: any
  pageCids: any

  constructor(createSubplebbitOptions?: any) {
    super()
    this.address = createSubplebbitOptions?.address
  }

  update() {
    this.updateCalledTimes++
    if (this.updateCalledTimes > 1) {
      throw Error(
        'with the current hooks, subplebbit.update() should be called maximum 1 times, this number might change if the hooks change and is only there to catch bugs, the real comment.update() can be called infinite times'
      )
    }
    // is ipnsName is known, look for updates and emit updates immediately after creation
    if (!this.address) {
      throw Error(`can't update without subplebbit.address`)
    }
    // don't update twice
    if (this.updating) {
      return
    }
    this.updating = true
    simulateLoadingTime().then(() => {
      this.simulateUpdateEvent()
    })
  }

  simulateUpdateEvent() {
    this.description = this.address + ' description updated'
    this.emit('update', this)
  }

  async getSortedPosts(pageCid: string) {
    // need to wait twice otherwise react renders too fast and fetches too many pages in advance
    await simulateLoadingTime()
    return subplebbitGetSortedPosts(pageCid, this)
  }
}

// define it here because also used it plebbit.getSubplebbit()
const subplebbitGetSortedPosts = (pageCid: string, subplebbit: any) => {
  const page: any = {
    nextCid: subplebbit.address + ' ' + pageCid + ' - next sorted comments cid',
    comments: [],
  }
  const postCount = 100
  let index = 0
  while (index++ < postCount) {
    page.comments.push({
      timestamp: index,
      cid: pageCid + ' comment cid ' + index,
      subplebbitAddress: subplebbit.address,
      upvoteCount: index,
      downvoteCount: 10,
    })
  }
  return page
}

let challengeRequestCount = 0
let challengeAnswerCount = 0

class Publication extends EventEmitter {
  timestamp: number | undefined
  content: string | undefined
  cid: string | undefined
  challengeRequestId = `r${++challengeRequestCount}`
  challengeAnswerId = `a${++challengeAnswerCount}`

  async publish() {
    await simulateLoadingTime()
    this.simulateChallengeEvent()
  }

  simulateChallengeEvent() {
    const challenge = { type: 'text', challenge: '2+2=?' }
    const challengeMessage = {
      type: 'CHALLENGE',
      challengeRequestId: this.challengeRequestId,
      challenges: [challenge],
    }
    this.emit('challenge', challengeMessage, this)
  }

  async publishChallengeAnswers(challengeAnswers: string[]) {
    await simulateLoadingTime()
    this.simulateChallengeVerificationEvent()
  }

  simulateChallengeVerificationEvent() {
    // if publication has content, create cid for this content and add it to comment and challengeVerificationMessage
    this.cid = this.content && `${this.content} cid`
    const publication = this.cid && { cid: this.cid }

    const challengeVerificationMessage = {
      type: 'CHALLENGEVERIFICATION',
      challengeRequestId: this.challengeRequestId,
      challengeAnswerId: this.challengeAnswerId,
      challengeAnswerIsVerified: true,
      publication,
    }
    this.emit('challengeverification', challengeVerificationMessage, this)
  }
}

export class Comment extends Publication {
  updateCalledTimes = 0
  updating = false
  author: any
  ipnsName: string | undefined
  upvoteCount: number | undefined
  downvoteCount: number | undefined
  content: string | undefined
  parentCid: string | undefined

  constructor(createCommentOptions?: any) {
    super()
    this.ipnsName = createCommentOptions?.ipnsName
    this.cid = createCommentOptions?.cid
    this.upvoteCount = createCommentOptions?.upvoteCount
    this.downvoteCount = createCommentOptions?.downvoteCount
    this.content = createCommentOptions?.content
    this.author = createCommentOptions?.author
    this.timestamp = createCommentOptions?.timestamp
    this.parentCid = createCommentOptions?.parentCid
  }

  update() {
    this.updateCalledTimes++
    if (this.updateCalledTimes > 2) {
      throw Error(
        'with the current hooks, comment.update() should be called maximum 2 times, this number might change if the hooks change and is only there to catch bugs, the real comment.update() can be called infinite times'
      )
    }
    // is ipnsName is known, look for updates and emit updates immediately after creation
    if (!this.ipnsName) {
      throw Error(`can't update without comment.ipnsName`)
    }
    // don't update twice
    if (this.updating) {
      return
    }
    this.updating = true
    simulateLoadingTime().then(() => {
      this.simulateUpdateEvent()
    })
  }

  simulateUpdateEvent() {
    // simulate finding vote counts on an IPNS record
    this.upvoteCount = typeof this.upvoteCount === 'number' ? this.upvoteCount + 2 : 3
    this.downvoteCount = typeof this.downvoteCount === 'number' ? this.downvoteCount + 1 : 1
    this.emit('update', this)
  }
}

export class Vote extends Publication {}

export default function () {
  return new Plebbit()
}
