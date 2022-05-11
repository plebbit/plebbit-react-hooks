// script to start IPFS and plebbit-js for testing

const {exec, execSync} = require('child_process')
const Plebbit = require('@plebbit/plebbit-js')

// init ipfs binary
try {
  execSync(`ipfs init`, {stdio: 'inherit'})
}
catch (e) {}

// allow * origin on ipfs api to bypass cors browser error
// very insecure do not do this in production
execSync(`ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'`, {stdio: 'inherit'})

// start ipfs daemon
let ipfsProcess = exec(`ipfs daemon --enable-pubsub-experiment`)
console.log(`ipfs process started with pid ${ipfsProcess.pid}`)
ipfsProcess.stderr.on('data', console.error)
ipfsProcess.stdin.on('data', console.log)
ipfsProcess.stdout.on('data', console.log)
ipfsProcess.on('error', console.error)
ipfsProcess.on('exit', () => {
  console.error(`ipfs process with pid ${ipfsProcess.pid} exited`)
  process.exit(1)
})
process.on('exit', () => {
  exec(`kill ${ipfsProcess.pid + 1}`)
})

const ipfsDaemonIsReady = () => new Promise(resolve => {
  ipfsProcess.stdout.on('data', (data) => {
    if (data.match('Daemon is ready')) {
      resolve()
    }
  })
})

// always use the same private key and subplebbit address when testing
const privateKey = `-----BEGIN ENCRYPTED PRIVATE KEY-----
MIIFODBiBgkqhkiG9w0BBQ0wVTA0BgkqhkiG9w0BBQwwJwQQT6XJaagw5BPx+nlt
EgqQ2gICJxACASAwDAYIKoZIhvcNAgsFADAdBglghkgBZQMEASoEEA+BOqkJO/AJ
DpSpdwXlaF4EggTQ8QucbifiOZc/BYfnx2rzDs1VTFNrNSdXt5sOSbhJ2id7JrZc
WID0Jv82qadimt2hry6BK5lPHytqKkJShtBlyC8eeGym60eFSDTpDKoXrLz7Zscv
xWEKDV+p76fqynzAG8LvOV1EHaL8VfrApysA361sbo1YWU/Q8sgxnsxVfI+DCRbt
GOfY8qdRiE2/HJwMlqy1FQ+rUEKu+B5sLezZGqvJKtWIKEIYi0zBdv3Bo47ofomO
EmGP43q3YO82Q0dnN5E3j4CItDOP4Uv/fHdxMiXqhsteZrpgvxXqwhTnemsXdCEp
V5O0gPeYm390Xp+L9B6wCY59cmXyNQf6rfgtlHWZ3Eb7DRsjLoDLjTc3E1OhJExA
0J/29zneX+ynTwLfeYhQiq+TRM96cvXXFv+hc9uHyBDsyFrRpzEJgIcFwFhls+tk
gr46O9D7+WRYw6v+K7crpvQvRBsOf57frRnWjq2rKdbnPriVZHkl0Hyk/0AOtW46
nWUlaBklW41M2Kb+Zc7tIZdtX9EQgG2eP67bIoVkxF2v3OP/4BP0OJ2YsPL0fWm3
DRBox3r8k1HSKA2u81KcyK1adW8zP6iNwiCf++0SkE8fNzPM23HZANETmQ9ffD3U
VoSbxKA8DnRu2QHJkdhwMTWSw+MBxt8qy23Ju//rRE0FldFH0wG4MFyd1/ba2LGz
cFg3ltiW+Kq8daEtUNXpXmc7RyB2A3Q9rTNAfbY5bLh2JsYdqshP1WqAGLdq/WQb
YWvYvdR1tPzJczg2Sz9am4z5JBq3bcul0AvWEy7YLBEz6pceQcS6HCaxlUy5iu6n
K/1JKQLPgyTUdeRVzfolsvSECZnMaUVsJaDGuwzrSuV+8HquBbQjtuWFNSnmEnOj
xFGdyWXRkKxjcdLwQf+N9Y3Uv8Z29etA+ArO2j5Em8gYMekC8nGgsvH1pWgEOlvp
msQyRndvITeJj24FIlWq+G5PYpPKuiX5qbkPLl9nS0eY/czLwInweWIZ81whmenh
ycODOANGRtJjrix5TIdELZnzQwoitby6MA3kaKuWOKvIxz/2vvwxRAUHroW9mXLq
X8+8BLHeunwFbMG+rrdn/lKur5zL3HCVGXk6LWQhG2tzSWKANcCTjR+/9srvdoWv
IYqqFk2qdzKcKCIgF8nmVP6UhkIxwt9jI9ulSHTQxttqTuhGE1mx1z/dSl1g9Yjn
FWwA1ZRNxCBihdsP6LXSpO+LSlLjPVs+f074ihKT0k/nIdEmGenA1/XSfmiGkRke
q+sG2ravSE1vn/hx0pAxVk+1qODPzdcEP0AgD8aDSoq3f+VxTRgmeq+rr4rD8lEp
RSw7RqMh6isk0DcI3leldGuyv7AnhPPUGWjqvy7H2Fv0Vtr1kkQcCl8qFIaPrOfJ
XTCLqOLq8qer5mPL/vyJnAEIlMC0W5DkyCyBulm42qx7utUx0WD0hzHohhduSg8b
yl8LWGmTkZ+9FRe5UhbVpKtA3ZDYkEQdQNCKSFVK1PPx/OYVQQqKU9T+f5M6y+sy
BjVA8VU6bAU6H88J5mBACsjuKyjh4J+RIoReMxDOKQg7PJox464gQ7mUNMepxlab
tQuns2k5sbZtcecJ/VsilRhju5KcTDZ3Zdy8XInkSkGxlc1m7/xRVjysqP4=
-----END ENCRYPTED PRIVATE KEY-----`

// set up a subplebbit for testing
;(async () => {
  await ipfsDaemonIsReady()

  const plebbit = await Plebbit({
    ipfsHttpClientOptions: 'http://localhost:5001',
    // 'dataPath': '/tmp/.plebbit'
  })
  const signer = await plebbit.createSigner({privateKey, type: 'rsa'})

  console.log(`creating subplebbit with address '${signer.address}'...`)
  const subplebbit = await plebbit.createSubplebbit({
    'signer': signer,
    'title': 'subplebbit title',
    'address' : signer.address,
  })
  console.log('subplebbit created')

  console.log('starting subplebbit...')
  await subplebbit.start()
  console.log(`subplebbit started with address ${signer.address}`)
})()
