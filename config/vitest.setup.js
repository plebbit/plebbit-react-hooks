// import crypto from "crypto"

// fix TextDecoder isn't defined in jsdom
const {TextEncoder, TextDecoder} = require('util')
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// fix TypeError: Failed to execute 'digest' on 'SubtleCrypto': 2nd argument is not instance of ArrayBuffer, Buffer, TypedArray, or DataView.
// fix TypeError: crypto.web.getRandomValues is not a function
// Object.defineProperty(global.self, "crypto", {value: {
//   subtle: crypto.webcrypto.subtle,
//   getRandomValues: (arr) => crypto.randomBytes(arr.length)
// }})
