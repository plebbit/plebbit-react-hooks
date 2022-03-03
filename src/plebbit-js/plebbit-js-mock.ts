import EventEmitter from 'events'

class MockedPlebbit {
  createComment() {
    return new Comment()
  }
}

class Comment extends EventEmitter {
  publish() {}
}

export default function Plebbit() {
  return new MockedPlebbit()
}
