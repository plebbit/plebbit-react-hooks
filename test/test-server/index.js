// script to start IPFS and plebbit-js for testing

const Plebbit = require('@plebbit/plebbit-js')
const getTmpFolderPath = require('tempy').directory
const plebbitDataPath = getTmpFolderPath()
const startIpfs = require('./start-ipfs')
const {offlineIpfs, pubsubIpfs} = require('./ipfs-config')
const signers = require('../fixtures/signers')

// always use the same private key and subplebbit address when testing
const privateKey = signers[0].privateKey

// set up a subplebbit for testing
;(async () => {
  await startIpfs(offlineIpfs)
  await startIpfs(pubsubIpfs)

  const plebbitOptions = {
    ipfsHttpClientOptions: `http://localhost:${offlineIpfs.apiPort}/api/v0`,
    pubsubHttpClientOptions: `http://localhost:${pubsubIpfs.apiPort}/api/v0`,
    // pubsubHttpClientOptions: `https://pubsubprovider.xyz/api/v0`,
    dataPath: plebbitDataPath,
  }

  const plebbit = await Plebbit(plebbitOptions)
  const plebbit2 = await Plebbit(plebbitOptions)
  const signer = await plebbit.createSigner({privateKey, type: 'rsa'})

  const dbConfig = {
    client: 'sqlite3',
    connection: {
      filename: ':memory:',
    },
    useNullAsDefault: true,
  }

  console.log(`creating subplebbit with address '${signer.address}'...`)
  const subplebbit = await plebbit.createSubplebbit({
    signer: signer,
    database: dbConfig,

    // 'title': 'subplebbit title',
    // 'address' : signer.address,
  })
  subplebbit.on('challengerequest', console.log)
  subplebbit.on('challengeanswer', console.log)
  subplebbit.setProvideCaptchaCallback((challengeRequestMessage) => {
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
  subplebbit.once('update', async () => {
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
    console.log('test server ready')

    // create a test server to be able to use npm module 'wait-on'
    // to know when the test server is finished getting ready
    // and able to start the automated tests
    require('http')
      .createServer((req, res) => res.end('test server ready'))
      .listen(59281)
  })
})()
