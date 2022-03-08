import EventEmitter from 'events'
export { mockPlebbitJs as mockPlebbitJs } from '.'

// TODO: make load time changeable with env variable
// so the frontend can test with latency
const loadTime = 10
const waitForLoad = () => new Promise((r) => setTimeout(r, loadTime))

export class Plebbit {
  createComment(createCommentOptions: any) {
    return new Comment(createCommentOptions)
  }
  createVote() {
    return new Vote()
  }

  async getComment(commentCid: string) {
    await waitForLoad()
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
    await waitForLoad()
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

  async publishChallengeAnswer(challengeAnswers: string[]) {
    await waitForLoad()
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
      waitForLoad().then(() => {
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

class Vote extends Publication {}

export default function () {
  return new Plebbit()
}
