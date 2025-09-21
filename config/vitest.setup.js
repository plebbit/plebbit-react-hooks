// import crypto from 'crypto'

// fix TextDecoder isn't defined in jsdom
// const {TextEncoder, TextDecoder} = require('util')
// global.TextEncoder = TextEncoder
// global.TextDecoder = TextDecoder

// fix TypeError: Failed to execute 'digest' on 'SubtleCrypto': 2nd argument is not instance of ArrayBuffer, Buffer, TypedArray, or DataView.
// fix TypeError: crypto.web.getRandomValues is not a function
// Object.defineProperty(global.self, 'crypto', {value: {
//   subtle: crypto.webcrypto.subtle,
//   getRandomValues: (arr) => crypto.randomBytes(arr.length)
// }})

// fix TypeError: Failed to execute 'digest' on 'SubtleCrypto': 2nd argument is not instance of ArrayBuffer, Buffer, TypedArray, or DataView.
// which is because @noble/ed25519 in getSolWalletFromPlebbitPrivateKey doesn't use the correct crypto because of the vitest/jsdom env
{
  // don't put digest in global scope
  const digest = globalThis.crypto.subtle.digest.bind(globalThis.crypto.subtle)
  globalThis.crypto.subtle.digest = async (algorithm, data) => {
    let view
    if (data instanceof ArrayBuffer) {
      view = new DataView(data)
    } else if (ArrayBuffer.isView(data)) {
      const buf = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
      view = new DataView(buf)
    } else {
      throw new TypeError(`crypto.subtle.digest only accepts ArrayBuffer, TypedArray or DataView got: ${typeof data}`)
    }
    return digest(algorithm, view)
  }
}
