const fetchShim = (url, options) => fetch(url, options)

// Attach standard classes for parity with node-fetch API when code accesses fetch.Headers etc.
fetchShim.Headers = globalThis.Headers
fetchShim.Request = globalThis.Request
fetchShim.Response = globalThis.Response

export const Headers = globalThis.Headers
export const Request = globalThis.Request
export const Response = globalThis.Response

export default fetchShim
