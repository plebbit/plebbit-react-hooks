// add jest setup (jsdom) here

// fix TextDecoder isn't defined in jsdom
const {TextEncoder, TextDecoder} = require('util')
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder
global.crypto = undefined // You have to make crypto undefined so it uses web API
