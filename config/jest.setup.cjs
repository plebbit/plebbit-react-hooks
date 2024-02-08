// add jest setup (jsdom) here

// fix TextDecoder isn't defined in jsdom
const {TextEncoder, TextDecoder} = require('util')
// import {TextEncoder, TextDecoder} from 'util'
console.log(TextEncoder)
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder
