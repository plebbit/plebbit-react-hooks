import EventEmitter from 'events'

// TODO: make load time changeable with env variable
// so the frontend can test with latency
const loadingTime = 10
export const simulateLoadingTime = () => new Promise((r) => setTimeout(r, loadingTime))

// array of subplebbit addresses probably created by the user
const createdSubplebbitAddresses: any = []

export class Plebbit {
  async createSigner() {
    return {
      privateKey: 'private key',
      address: 'address',
    }
  }

  async createSubplebbit(createSubplebbitOptions: any) {
    if (!createSubplebbitOptions) {
      createSubplebbitOptions = {}
    }
    if (!createSubplebbitOptions.address) {
      createSubplebbitOptions = {...createSubplebbitOptions, address: 'created subplebbit address'}
      createdSubplebbitAddresses.push('created subplebbit address')
    }
    return new Subplebbit(createSubplebbitOptions)
  }

  async getSubplebbit(subplebbitAddress: string) {
    await simulateLoadingTime()
    const createSubplebbitOptions = {
      address: subplebbitAddress,
    }
    const subplebbit: any = new Subplebbit(createSubplebbitOptions)
    subplebbit.title = subplebbit.address + ' title'
    const hotPageCid = subplebbit.address + ' page cid hot'
    subplebbit.posts.pages.hot = getCommentsPage(hotPageCid, subplebbit)
    subplebbit.posts.pageCids = {
      hot: hotPageCid,
      topAll: subplebbit.address + ' page cid topAll',
      new: subplebbit.address + ' page cid new',
    }
    return subplebbit
  }

  async listSubplebbits() {
    return [...new Set(['list subplebbit address 1', 'list subplebbit address 2', ...createdSubplebbitAddresses])]
  }

  async createComment(createCommentOptions: any) {
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

  async createVote() {
    return new Vote()
  }

  async createCommentEdit(createCommentEditOptions: any) {
    return new CommentEdit(createCommentEditOptions)
  }

  async createSubplebbitEdit(createSubplebbitEditOptions: any) {
    return new SubplebbitEdit(createSubplebbitEditOptions)
  }
}

export class Pages {
  pageCids: any = {}
  pages: any = {}
  subplebbit: any
  comment: any

  constructor(pagesOptions?: any) {
    Object.defineProperty(this, 'subplebbit', {value: pagesOptions?.subplebbit, enumerable: false})
    Object.defineProperty(this, 'comment', {value: pagesOptions?.comment, enumerable: false})
  }

  async getPage(pageCid: string) {
    // need to wait twice otherwise react renders too fast and fetches too many pages in advance
    await simulateLoadingTime()
    return getCommentsPage(pageCid, this.subplebbit)
  }
}

export class Subplebbit extends EventEmitter {
  updateCalledTimes = 0
  updating = false
  address: string | undefined
  title: string | undefined
  description: string | undefined
  posts: Pages

  constructor(createSubplebbitOptions?: any) {
    super()
    this.address = createSubplebbitOptions?.address
    this.posts = new Pages({subplebbit: this})
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

  // use getting to easily mock it
  get roles() {
    return this.rolesToGet()
  }

  // mock this method to get different roles
  rolesToGet() {
    return {}
  }

  async edit(editSubplebbitOptions: any) {
    for (const prop in editSubplebbitOptions) {
      if (editSubplebbitOptions[prop]) {
        // @ts-ignore
        this[prop] = editSubplebbitOptions[prop]
      }
    }
  }
}
// make roles enumarable so it acts like a regular prop
Object.defineProperty(Subplebbit.prototype, 'roles', {enumerable: true})

// define it here because also used it plebbit.getSubplebbit()
const getCommentsPage = (pageCid: string, subplebbit: any) => {
  const page: any = {
    nextCid: subplebbit.address + ' ' + pageCid + ' - next page cid',
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
      author: {
        address: pageCid + ' author address ' + index,
      },
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
    const challenge = {type: 'text', challenge: '2+2=?'}
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
    const publication = this.cid && {cid: this.cid}

    const challengeVerificationMessage = {
      type: 'CHALLENGEVERIFICATION',
      challengeRequestId: this.challengeRequestId,
      challengeAnswerId: this.challengeAnswerId,
      challengeSuccess: true,
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
  replies: any

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
    this.replies = new Pages({comment: this})
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

export class CommentEdit extends Publication {}

export class SubplebbitEdit extends Publication {}

export default async function () {
  return new Plebbit()
}
