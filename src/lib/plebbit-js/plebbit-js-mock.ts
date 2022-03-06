import EventEmitter from 'events'

// TODO: make load time changeable with env variable
// so the frontend can test with latency
const loadTime = 10
const waitForLoad = () => new Promise(r => setTimeout(r, loadTime))

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
      commentIpnsName: commentCid + ' ipns name'
    }
    return new Comment(createCommentOptions)
  }
}

let challengeRequestCount = 0
let challengeAnswerCount = 0

class Publication extends EventEmitter {
  challengeRequestId = `r${++challengeRequestCount}`
  challengeAnswerId = `a${++challengeAnswerCount}`

  async publish() {
    await waitForLoad()
    const challenge = {type: 'text', challenge: '2+2=?'}
    const challengeMessage = {
      type: 'CHALLENGE',
      challengeRequestId: this.challengeRequestId,
      challenges: [challenge]
    }
    this.emit('challenge', challengeMessage, this)
  }

  async publishChallengeAnswer(challengeAnswers: string[]) {
    await waitForLoad()
    const challengeVerificationMessage = {
      type: 'CHALLENGEVERIFICATION',
      challengeRequestId: this.challengeRequestId,
      challengeAnswerId: this.challengeAnswerId,
      challengeAnswerIsVerified: true
    }
    this.emit('challengeverification', challengeVerificationMessage, this)
  }
}

export class Comment extends Publication {
  cid: string | undefined
  commentIpnsName: string | undefined
  upvoteCount: number | undefined
  downvoteCount: number | undefined

  constructor(createCommentOptions?: any) {
    super()
    this.commentIpnsName = createCommentOptions?.commentIpnsName
    this.cid = createCommentOptions?.cid
    this.upvoteCount = createCommentOptions?.upvoteCount
    this.downvoteCount = createCommentOptions?.downvoteCount

    // is commentIpnsName is known, look for updates and emit updates immediately after creation
    if (this.commentIpnsName) {
      waitForLoad().then(() => {
        this.simulateUpdateEvent()
      })
    }
  }

  simulateUpdateEvent() {
    // simulate finding vote counts on an IPNS record
    this.upvoteCount = 1
    this.downvoteCount = 0
    this.emit('update', this)
  }
}

class Vote extends Publication {}

export default function() {
  return new Plebbit()
}
