import EventEmitter from 'events'
export { mockPlebbitJs as mockPlebbitJs } from '.'

// TODO: make load time changeable with env variable
// so the frontend can test with latency
const loadingTime = 10
const simulateLoadingTime = () => new Promise((r) => setTimeout(r, loadingTime))

export class Plebbit {
  createSubplebbit(createSubplebbitOptions: any) {
    return new Subplebbit(createSubplebbitOptions)
  }

  async getSubplebbit(subplebbitAddress: string) {
    await simulateLoadingTime()
    const createSubplebbitOptions = {
      address: subplebbitAddress
    }
    const subplebbit: any = new Subplebbit(createSubplebbitOptions)
    // mock properties of subplebbitToGet unto the subplebbit instance
    for (const prop in this.subplebbitToGet(subplebbit)) {
      subplebbit[prop] = this.subplebbitToGet(subplebbit)[prop]
    }
    return subplebbit
  }

  // mock this method to get a subplebbit with different title, posts, address, etc
  subplebbitToGet(subplebbit?: any): any {
    const sortedPostsCid = subplebbit.address + ' sorted posts cid hot'
    if (subplebbit) {
      return {
        title: subplebbit.address + ' title',
        sortedPosts: {hot: this.sortedPostsToGet({subplebbit, sortedPostsCid})},
        sortedPostsCids: {
          hot: sortedPostsCid,
          top: subplebbit.address + ' sorted posts cid top',
          old: subplebbit.address + ' sorted posts cid old'
        }
      }
    }
    return {}
  }

  // mock this method to get a different result from plebbit.getSubplebbit subplebbit.sortedPosts
  sortedPostsToGet(options?: any) {
    let subplebbitAddress
    let commentCidPrefix = ''
    let nextSortedCommentsCidPrefix = ''
    if (options?.subplebbit?.address) {
      commentCidPrefix += options.subplebbit.address + ' '
      nextSortedCommentsCidPrefix += options.subplebbit.address + ' '
      subplebbitAddress = options.subplebbit.address
    }
    if (options?.sortedPostsCid) {
      commentCidPrefix += options.sortedPostsCid + ' '
      nextSortedCommentsCidPrefix += options.sortedPostsCid + ' '
    }
    if (nextSortedCommentsCidPrefix) {
      nextSortedCommentsCidPrefix += '- '
    }
    const sortedComments: any = {
      nextSortedCommentsCid: nextSortedCommentsCidPrefix + 'next sorted comments cid', 
      comments: []
    }
    const postCount = 100
    let index = 0
    while (index++ < postCount) {
      sortedComments.comments.push({cid: commentCidPrefix + 'sorted comment cid ' + index, subplebbitAddress})
    }
    return sortedComments
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
  address: string | undefined
  title: string | undefined
  description: string | undefined
  sortedPosts: any
  sortedPostsCids: any

  constructor(createSubplebbitOptions?: any) {
    super()
    this.address = createSubplebbitOptions?.address

    // is ipnsName is known, look for updates and emit updates immediately after creation
    if (this.address) {
      simulateLoadingTime().then(() => {
        this.simulateUpdateEvent()
      })
    }
  }

  simulateUpdateEvent() {
    this.description = this.address + ' description updated'
    this.emit('update', this)
  }

  async getSortedPosts(sortedPostsCid: string) {
    await simulateLoadingTime()
    return this.sortedPostsToGet({sortedPostsCid})
  }

  // mock this method to get a different result from subplebbit.getSortedPosts
  sortedPostsToGet(options?: any) {
    let commentCidPrefix = this.address + ' '
    let nextSortedCommentsCidPrefix = this.address + ' '
    if (options?.sortedPostsCid) {
      commentCidPrefix += options.sortedPostsCid + ' '
      nextSortedCommentsCidPrefix += options.sortedPostsCid + ' '
    }
    nextSortedCommentsCidPrefix += '- '
    const sortedComments: any = {
      nextSortedCommentsCid: nextSortedCommentsCidPrefix + 'next sorted comments cid', 
      comments: []
    }
    const postCount = 100
    let index = 0
    while (index++ < postCount) {
      sortedComments.comments.push({cid: commentCidPrefix + 'sorted comment cid ' + index, subplebbitAddress: this.address})
    }
    return sortedComments
  }
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
  author: any
  ipnsName: string | undefined
  upvoteCount: number | undefined
  downvoteCount: number | undefined
  content: string | undefined
  parentCommentCid: string | undefined

  constructor(createCommentOptions?: any) {
    super()
    this.ipnsName = createCommentOptions?.ipnsName
    this.cid = createCommentOptions?.cid
    this.upvoteCount = createCommentOptions?.upvoteCount
    this.downvoteCount = createCommentOptions?.downvoteCount
    this.content = createCommentOptions?.content
    this.author = createCommentOptions?.author
    this.timestamp = createCommentOptions?.timestamp
    this.parentCommentCid = createCommentOptions?.parentCommentCid

    // is ipnsName is known, look for updates and emit updates immediately after creation
    if (this.ipnsName) {
      simulateLoadingTime().then(() => {
        this.simulateUpdateEvent()
      })
    }
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
