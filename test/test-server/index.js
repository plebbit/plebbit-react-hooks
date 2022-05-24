// script to start IPFS and plebbit-js for testing

const Plebbit = require('@plebbit/plebbit-js')
const getTmpFolderPath = require('tempy').directory
const plebbitDataPath = getTmpFolderPath()
const startIpfs = require('./start-ipfs')
const {offlineIpfs, pubsubIpfs} = require('./ipfs-config')

// always use the same private key and subplebbit address when testing
const privateKey = `-----BEGIN ENCRYPTED PRIVATE KEY-----
MIIFODBiBgkqhkiG9w0BBQ0wVTA0BgkqhkiG9w0BBQwwJwQQto74Ca67c6yJulEY
iUoVDgICJxACASAwDAYIKoZIhvcNAgsFADAdBglghkgBZQMEASoEEMziiSkrJw8v
fiLJcNUaBgsEggTQ8G4dhLaxvAJoSedHh9BiAWKno7VnHsDaJkCZxFptqV8WwMzZ
KikCt00kdSRDr6/OdR08I8cHhROooMTZPZlW74+6m/fzQuZrNhcRDGe3YIEBt9+k
k6Pzvw15pJBoAhSMF0engAVt9a3tTxMy3zl6gBqhhY9UnY8WUBlN/rKgkl7eK3s5
zDuMYkpFC0WFUByB2no7iE7Gc8+DD6Rw+wxLalD/zOqBvzXQHfS18lt9P/Y7RKa0
6DDww8Ba88EnyVnyTM6caITx7JQKwhqG4FZIdtb8iaaqYN/tbX14Kd+ThiuGntmm
APca1dYFOMFjh7q+GHQDCzP/8Jfegr3xXQQVQXsw5Ahr4f8S+BRn1Y6Xe7fMAuFD
VeU2+Tnw6KZFhL88p2Y1ixg77Zeeps0xYCCSMrUChnazUVLI1wK9axHDTJCvAler
1u5pFcQTZdcW7Cwi+oUj0yR2fp0SRfsrYdc2J1o4r6rBS55lfvAh4v0LWS/w+I7V
Zq1okeDdzhv6Wd9UbjmBy4JU2nLKeygpUmWub9gt4n7iYWnHGSZGwiQXN7S3V9lj
6JsAoTM/wukdUTMtVOmMM6kGiuzcimGeIuX18yVaV80MhYRfQ0P/IDYApX9tNDjs
Kzv0lycKSao/86tQidRK+IECX2Xnp/hoyDFhAPbyk5DDb0Mf2VjkafTkIZaGYyDv
2JpQlQhNfCX8CAAbAlhGdVBp9hJPMG6En2Ay3Qjl5dBNvStM+lViP7PagLqNvYrF
YW2BPIfpwWArJxhOBcx0fz/l6igPd1ovmIbdX6JUvdOKRi7YiTpuFzF8MQoZ5hB7
Ff5iE28dT/OHYSuWgQ0b1lgepUJJGNCEbyocdRzZXuR+ydVZ0SiZp3UO7gi3Qfsm
1omvWyWtDeADLxntUNNGBym+X9/mqWlOQ/4k7+BMWdI2rKOpp6Lz8C6WYBqzvpdp
ZExx6jtMq7Jt8LGEWgpYytWhJODaLJveHlLaNlUMIm1c3drlaB0zBkMDj8we1eCz
vUw3DKY9Q0ve/0ljGoUr+ZEQDKqnqEIz/jSjCZMPWDs0/RXd6ptoLg/h5Z3wxj9f
3CcgVDcFx6MG6YaN37StLbUGmJECIZgGtddT8KxuwjZiSXqHbvwm9wYkgQOAEhUD
ieEbhcCFznREXgwII1HzQ0ca9gonoI2n1Jl3LJPquc1aw/I3ZSFoiyJZ8znkV69H
0QnpVJ47a7tXbwqKnpOUS/qBKyTm5LJEFO2wLzUob8X2/WstVHgn8nyLCuPjel41
+FzDlFEN8fTU6IxsO/LereCYyqLKrTWg/O9soIV3w6f4dpjiP70fk8RzVNFjbxFe
TQ/m1H3Ok+amNYsdXhV4hTHcnFAQWjM6oZ+yVABjhTwZKeyZi4qR8xhmDVjvAlcS
G2FBFFWplZyEa+aIbHBpaL4tvAoNQFGy6c/7RZrFVrUq0Av6bpxzx19GAX5QCpM+
FXasOuVetiiVPLP0MRon5pZ4QrJJ6eVZv2lDoOxAsI4oocyvY37uGGOtg/SjsNET
If2RcQgw+NGBHIpHySJ5nogzLI069aPLXx+XEvnbYW9URthw/iaywOrdNR0a5rqU
ij9V8ZU7Xc1cDNjOSq9kWQOuigqPQR8f8JubiPFGHcRpa5r9KRqgxp76C54=
-----END ENCRYPTED PRIVATE KEY-----`

// set up a subplebbit for testing
;(async () => {
  await startIpfs(offlineIpfs)
  await startIpfs(pubsubIpfs)

  const plebbitOptions = {
    ipfsHttpClientOptions: `http://localhost:${offlineIpfs.apiPort}/api/v0`,
    // pubsubHttpClientOptions: `http://localhost:${pubsubIpfs.apiPort}/api/v0`,
    pubsubHttpClientOptions: `https://pubsubprovider.xyz/api/v0`,
    dataPath: plebbitDataPath,
  }

  const plebbit = await Plebbit(plebbitOptions)
  const plebbit2 = await Plebbit(plebbitOptions)
  const signer = await plebbit.createSigner({privateKey, type: 'rsa'})

  console.log(`creating subplebbit with address '${signer.address}'...`)
  const subplebbit = await plebbit.createSubplebbit({
    signer: signer,
    // 'title': 'subplebbit title',
    // 'address' : signer.address,
  })
  await subplebbit.setProvideCaptchaCallback((challengeRequestMessage) => {
    return [[{challenge: '1+1=?', type: 'text'}]]
  })
  subplebbit.setValidateCaptchaAnswerCallback((challengeAnswerMessage) => {
    const challengeSuccess = challengeAnswerMessage.challengeAnswers[0] === '2'
    const challengeErrors = challengeSuccess ? undefined : ['Result of math expression is incorrect']
    return [challengeSuccess, challengeErrors]
  })
  console.log('subplebbit created')

  console.log('starting subplebbit...')
  await subplebbit.start(500)
  console.log(`subplebbit started with address ${signer.address}`)

  console.log('publish test comment')
  const comment = await plebbit2.createComment({
    title: 'comment title',
    content: 'comment content',
    subplebbitAddress: signer.address,
    signer,
    author: {address: signer.address},
  })
  comment.once('challenge', () => comment.publishChallengeAnswers(['2']))
  await comment.publish()
  console.log('test comment published')
})()
