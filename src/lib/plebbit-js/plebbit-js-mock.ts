import EventEmitter from 'events'

const loadingTime = 10
export const simulateLoadingTime = () => new Promise((r) => setTimeout(r, loadingTime))

// keep a list of created and edited owner subplebbits
// to reinitialize them with plebbit.createSubplebbit()
let createdOwnerSubplebbits: any = {}
let editedOwnerSubplebbits: any = {}

// reset the plebbit-js global state in between tests
export const resetPlebbitJsMock = () => {
  createdOwnerSubplebbits = {}
  editedOwnerSubplebbits = {}
}
export const debugPlebbitJsMock = () => {
  console.log({createdOwnerSubplebbits, editedOwnerSubplebbits})
}

export class Plebbit extends EventEmitter {
  async resolveAuthorAddress(authorAddress: string) {
    return 'resolved author address'
  }

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

    // no address provided so probably a user creating an owner subplebbit
    if (!createSubplebbitOptions.address && !createdOwnerSubplebbits[createSubplebbitOptions.address]) {
      createSubplebbitOptions = {...createSubplebbitOptions, address: 'created subplebbit address'}
      // createdSubplebbitAddresses.push('created subplebbit address')
      createdOwnerSubplebbits[createSubplebbitOptions.address] = {...createSubplebbitOptions}
    }
    // only address provided, so could be a previously created owner subplebbit
    // add props from previously created sub
    else if (createdOwnerSubplebbits[createSubplebbitOptions.address] && JSON.stringify(Object.keys(createSubplebbitOptions)) === '["address"]') {
      for (const prop in createdOwnerSubplebbits[createSubplebbitOptions.address]) {
        if (createdOwnerSubplebbits[createSubplebbitOptions.address][prop]) {
          createSubplebbitOptions[prop] = createdOwnerSubplebbits[createSubplebbitOptions.address][prop]
        }
      }
    }

    // add edited props if owner subplebbit was edited in the past
    if (editedOwnerSubplebbits[createSubplebbitOptions.address]) {
      for (const prop in editedOwnerSubplebbits[createSubplebbitOptions.address]) {
        if (editedOwnerSubplebbits[createSubplebbitOptions.address][prop]) {
          createSubplebbitOptions[prop] = editedOwnerSubplebbits[createSubplebbitOptions.address][prop]
        }
      }
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
    subplebbit.posts.pages.hot = subplebbit.posts.pageToGet(hotPageCid)
    subplebbit.posts.pageCids = {
      hot: hotPageCid,
      topAll: subplebbit.address + ' page cid topAll',
      new: subplebbit.address + ' page cid new',
      active: subplebbit.address + ' page cid active',
    }
    subplebbit.modQueue.pageCids = {
      pendingApproval: subplebbit.address + ' page cid pendingApproval',
    }
    return subplebbit
  }

  // TODO: implement event subplebbitschange
  get subplebbits() {
    return [...new Set(['list subplebbit address 1', 'list subplebbit address 2', ...Object.keys(createdOwnerSubplebbits)])]
  }

  async createComment(createCommentOptions: any) {
    return new Comment(createCommentOptions)
  }

  async getComment(commentCid: string) {
    await simulateLoadingTime()
    const createCommentOptions = {
      cid: commentCid,
      // useComment() requires timestamp or will use account comment instead of comment from store
      timestamp: 1670000000,
      ...this.commentToGet(commentCid),
    }
    return new Comment(createCommentOptions)
  }

  // mock this method to get a comment with different content, timestamp, address, etc
  commentToGet(commentCid?: string) {
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

  async createCommentModeration(createCommentModerationOptions: any) {
    return new CommentModeration(createCommentModerationOptions)
  }

  async createSubplebbitEdit(createSubplebbitEditOptions: any) {
    return new SubplebbitEdit(createSubplebbitEditOptions)
  }

  async fetchCid(cid: string) {
    if (cid?.startsWith('statscid')) {
      return JSON.stringify({hourActiveUserCount: 1})
    }
    throw Error(`plebbit.fetchCid not implemented in plebbit-js mock for cid '${cid}'`)
  }

  async pubsubSubscribe(subplebbitAddress: string) {}
  async pubsubUnsubscribe(subplebbitAddress: string) {}

  clients = {
    plebbitRpcClients: {
      'http://localhost:9138': new PlebbitRpcClient(),
    },
  }

  async validateComment(comment: any, validateCommentOptions: any) {}
}

class PlebbitRpcClient extends EventEmitter {
  state = 'connecting'
  settings: any = undefined
  constructor() {
    super()
    // simulate connecting to the rpc
    setTimeout(() => {
      this.state = 'connected'
      this.settings = {challenges: {}}
      this.emit('statechange', this.state)
      this.emit('settingschange', this.settings)
    }, 10)
  }

  async setSettings(settings: any) {
    this.settings = settings
    this.emit('settingschange', this.settings)
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
    return this.pageToGet(pageCid)
  }

  async validatePage(page: any) {}

  // mock this method to get pages with different content, or use to getPage without simulated loading time
  pageToGet(pageCid: string) {
    const subplebbitAddress = this.subplebbit?.address || this.comment?.subplebbitAddress
    const page: any = {
      nextCid: subplebbitAddress + ' ' + pageCid + ' - next page cid',
      comments: [],
    }
    const postCount = 100
    let index = 0
    while (index++ < postCount) {
      page.comments.push({
        timestamp: index,
        cid: pageCid + ' comment cid ' + index,
        subplebbitAddress,
        upvoteCount: index,
        downvoteCount: 10,
        author: {
          address: pageCid + ' author address ' + index,
        },
        updatedAt: index,
      })
    }
    return page
  }
}

export class Subplebbit extends EventEmitter {
  updateCalledTimes = 0
  updating = false
  firstUpdate = true
  address: string | undefined
  title: string | undefined
  description: string | undefined
  posts: Pages
  modQueue: Pages
  updatedAt: number | undefined
  statsCid: string | undefined
  state: string
  updatingState: string

  constructor(createSubplebbitOptions?: any) {
    super()
    this.address = createSubplebbitOptions?.address
    this.title = createSubplebbitOptions?.title
    this.description = createSubplebbitOptions?.description
    this.statsCid = 'statscid'
    this.state = 'stopped'
    this.updatingState = 'stopped'
    this.updatedAt = createSubplebbitOptions?.updatedAt

    this.posts = new Pages({subplebbit: this})
    // add subplebbit.posts from createSubplebbitOptions
    if (createSubplebbitOptions?.posts?.pages) {
      this.posts.pages = createSubplebbitOptions?.posts?.pages
    }
    if (createSubplebbitOptions?.posts?.pageCids) {
      this.posts.pageCids = createSubplebbitOptions?.posts?.pageCids
    }

    this.modQueue = new Pages({subplebbit: this})
    // add subplebbit.modQueue from createSubplebbitOptions
    if (createSubplebbitOptions?.modQueue?.pageCids) {
      this.modQueue.pageCids = createSubplebbitOptions?.modQueue?.pageCids
    }

    // only trigger a first update if argument is only ({address})
    if (!createSubplebbitOptions?.address || Object.keys(createSubplebbitOptions).length !== 1) {
      this.firstUpdate = false
    }
  }

  async update() {
    this.updateCalledTimes++
    if (this.updateCalledTimes > 1) {
      throw Error(
        'with the current hooks, subplebbit.update() should be called maximum 1 times, this number might change if the hooks change and is only there to catch bugs, the real comment.update() can be called infinite times'
      )
    }
    if (!this.address) {
      throw Error(`can't update without subplebbit.address`)
    }
    // don't update twice
    if (this.updating) {
      return
    }
    this.updating = true

    this.state = 'updating'
    this.updatingState = 'fetching-ipns'
    this.emit('statechange', 'updating')
    this.emit('updatingstatechange', 'fetching-ipns')

    simulateLoadingTime().then(() => {
      this.simulateUpdateEvent()
    })
  }

  async delete() {
    if (this.address) {
      delete createdOwnerSubplebbits[this.address]
      delete editedOwnerSubplebbits[this.address]
    }
  }

  simulateUpdateEvent() {
    if (this.firstUpdate) {
      this.simulateFirstUpdateEvent()
      return
    }

    this.description = this.address + ' description updated'
    // @ts-ignore
    this.updatedAt = this.updatedAt + 1

    this.updatingState = 'succeeded'
    this.emit('update', this)
    this.emit('updatingstatechange', 'succeeded')
  }

  // the first update event adds all the field from getSubplebbit
  async simulateFirstUpdateEvent() {
    this.firstUpdate = false
    this.updatedAt = Math.floor(Date.now() / 1000)

    this.title = this.address + ' title'
    const hotPageCid = this.address + ' page cid hot'
    this.posts.pages.hot = this.posts.pageToGet(hotPageCid)
    this.posts.pageCids = {
      hot: hotPageCid,
      topAll: this.address + ' page cid topAll',
      new: this.address + ' page cid new',
      active: this.address + ' page cid active',
    }
    this.modQueue.pageCids = {
      pendingApproval: this.address + ' page cid pendingApproval',
    }

    // simulate the ipns update
    this.updatingState = 'succeeded'
    this.emit('update', this)
    this.emit('updatingstatechange', 'succeeded')

    // simulate the next update
    this.updatingState = 'fetching-ipns'
    this.emit('updatingstatechange', 'fetching-ipns')
    simulateLoadingTime().then(() => {
      this.simulateUpdateEvent()
    })
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
    if (!this.address || typeof this.address !== 'string') {
      throw Error(`can't subplebbit.edit with no subplebbit.address`)
    }
    const previousAddress = this.address

    // do subplebbit.edit
    for (const prop in editSubplebbitOptions) {
      if (editSubplebbitOptions[prop]) {
        // @ts-ignore
        this[prop] = editSubplebbitOptions[prop]
      }
    }

    // keep a list of edited subplebbits to reinitialize
    // them with plebbit.createSubplebbit()
    editedOwnerSubplebbits[this.address] = {
      address: this.address,
      title: this.title,
      description: this.description,
    }

    // handle change of subplebbit.address
    if (editSubplebbitOptions.address) {
      // apply address change to editedOwnerSubplebbits
      editedOwnerSubplebbits[previousAddress] = {
        address: this.address,
        title: this.title,
        description: this.description,
      }
      delete editedOwnerSubplebbits[previousAddress]

      // apply address change to createdOwnerSubplebbits
      createdOwnerSubplebbits[this.address] = {
        ...createdOwnerSubplebbits[previousAddress],
        address: this.address,
      }
      delete createdOwnerSubplebbits[previousAddress]
    }
  }
}
// make roles enumarable so it acts like a regular prop
Object.defineProperty(Subplebbit.prototype, 'roles', {enumerable: true})

let challengeRequestCount = 0
let challengeAnswerCount = 0

class Publication extends EventEmitter {
  timestamp: number | undefined
  content: string | undefined
  cid: string | undefined
  challengeRequestId = `r${++challengeRequestCount}`
  challengeAnswerId = `a${++challengeAnswerCount}`
  state: string | undefined
  publishingState: string | undefined

  async publish() {
    this.state = 'publishing'
    this.publishingState = 'publishing-challenge-request'
    this.emit('statechange', 'publishing')
    this.emit('publishingstatechange', 'publishing-challenge-request')

    await simulateLoadingTime()
    this.simulateChallengeEvent()
  }

  simulateChallengeEvent() {
    this.publishingState = 'waiting-challenge-answers'
    this.emit('publishingstatechange', 'waiting-challenge-answers')

    const challenge = {type: 'text', challenge: '2+2=?'}
    const challengeMessage = {
      type: 'CHALLENGE',
      challengeRequestId: this.challengeRequestId,
      challenges: [challenge],
    }
    this.emit('challenge', challengeMessage, this)
  }

  async publishChallengeAnswers(challengeAnswers: string[]) {
    this.publishingState = 'publishing-challenge-answer'
    this.emit('publishingstatechange', 'publishing-challenge-answer')

    await simulateLoadingTime()
    this.publishingState = 'waiting-challenge-verification'
    this.emit('publishingstatechange', 'waiting-challenge-verification')

    await simulateLoadingTime()
    this.simulateChallengeVerificationEvent()
  }

  simulateChallengeVerificationEvent() {
    // if publication has content, create cid for this content and add it to comment and challengeVerificationMessage
    this.cid = this.content && `${this.content} cid`
    const commentUpdate = this.cid && {cid: this.cid}

    const challengeVerificationMessage = {
      type: 'CHALLENGEVERIFICATION',
      challengeRequestId: this.challengeRequestId,
      challengeAnswerId: this.challengeAnswerId,
      challengeSuccess: true,
      commentUpdate,
    }
    this.emit('challengeverification', challengeVerificationMessage, this)

    this.publishingState = 'succeeded'
    this.emit('publishingstatechange', 'succeeded')
  }
}

export class Comment extends Publication {
  updateCalledTimes = 0
  updating = false
  author: any
  upvoteCount: number | undefined
  downvoteCount: number | undefined
  content: string | undefined
  parentCid: string | undefined
  replies: any
  updatedAt: number | undefined
  subplebbitAddress: string | undefined
  state: string
  updatingState: string
  publishingState: string

  constructor(createCommentOptions?: any) {
    super()
    this.cid = createCommentOptions?.cid
    this.upvoteCount = createCommentOptions?.upvoteCount
    this.downvoteCount = createCommentOptions?.downvoteCount
    this.content = createCommentOptions?.content
    this.author = createCommentOptions?.author
    this.timestamp = createCommentOptions?.timestamp
    this.parentCid = createCommentOptions?.parentCid
    this.subplebbitAddress = createCommentOptions?.subplebbitAddress
    this.state = 'stopped'
    this.updatingState = 'stopped'
    this.publishingState = 'stopped'

    if (createCommentOptions?.author?.address) {
      this.author.shortAddress = `short ${createCommentOptions.author.address}`
    }

    this.replies = new Pages({comment: this})

    // add comment.replies from createCommentOptions
    if (createCommentOptions?.replies?.pages) {
      this.replies.pages = createCommentOptions?.replies?.pages
    }
    if (createCommentOptions?.replies?.pageCids) {
      this.replies.pageCids = createCommentOptions?.replies?.pageCids
    }
  }

  async update() {
    this.updateCalledTimes++
    if (this.updateCalledTimes > 2) {
      throw Error(
        'with the current hooks, comment.update() should be called maximum 2 times, this number might change if the hooks change and is only there to catch bugs, the real comment.update() can be called infinite times'
      )
    }
    // don't update twice
    if (this.updating) {
      return
    }
    this.updating = true

    this.state = 'updating'
    this.updatingState = 'fetching-ipfs'
    this.emit('statechange', 'updating')
    this.emit('updatingstatechange', 'fetching-ipfs')

    simulateLoadingTime().then(() => {
      this.simulateUpdateEvent()
    })
  }

  simulateUpdateEvent() {
    // if timestamp isn't defined, simulate fetching the comment ipfs
    if (!this.timestamp) {
      this.simulateFetchCommentIpfsUpdateEvent()
      return
    }

    // simulate finding vote counts on an IPNS record
    this.upvoteCount = typeof this.upvoteCount === 'number' ? this.upvoteCount + 2 : 3
    this.downvoteCount = typeof this.downvoteCount === 'number' ? this.downvoteCount + 1 : 1
    this.updatedAt = Math.floor(Date.now() / 1000)

    this.updatingState = 'succeeded'
    this.emit('update', this)
    this.emit('updatingstatechange', 'succeeded')
  }

  async simulateFetchCommentIpfsUpdateEvent() {
    // use plebbit.getComment() so mocking Plebbit.prototype.getComment works
    const commentIpfs = await new Plebbit().getComment(this.cid || '')
    this.content = commentIpfs.content
    this.author = commentIpfs.author
    this.timestamp = commentIpfs.timestamp
    this.parentCid = commentIpfs.parentCid
    this.subplebbitAddress = commentIpfs.subplebbitAddress

    // simulate the ipns update
    this.updatingState = 'fetching-update-ipns'
    this.emit('update', this)
    this.emit('updatingstatechange', 'fetching-update-ipns')
    simulateLoadingTime().then(() => {
      this.simulateUpdateEvent()
    })
  }
}

export class Vote extends Publication {}

export class CommentEdit extends Publication {}

export class CommentModeration extends Publication {}

export class SubplebbitEdit extends Publication {}

const createPlebbit: any = async (...args: any) => {
  return new Plebbit(...args)
}

createPlebbit.getShortAddress = (address: string) => {
  if (address.includes('.')) {
    return address
  }
  return address.substring(2, 14)
}

createPlebbit.getShortCid = (cid: string) => {
  return cid.substring(2, 14)
}

export default createPlebbit
