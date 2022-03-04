import EventEmitter from 'events'

// TODO: make load time changeable with env variable
// so the frontend can test with latency
const loadTime = 10
const waitForLoad = () => new Promise(r => setTimeout(r, loadTime))

class MockedPlebbit {
  createComment() {
    return new Comment()
  }
}

let challengeRequestCount = 0
let challengeAnswerCount = 0

class Comment extends EventEmitter {
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

export default function Plebbit() {
  return new MockedPlebbit()
}
