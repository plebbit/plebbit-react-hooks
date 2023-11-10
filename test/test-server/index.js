// script to start IPFS and plebbit-js for testing

const Plebbit = require('@plebbit/plebbit-js')
const getTmpFolderPath = require('tempy').directory
const plebbitDataPath = getTmpFolderPath()
const startIpfs = require('./start-ipfs')
const startPlebbitRpc = require('./start-plebbit-rpc')
const {offlineIpfs, pubsubIpfs, plebbitRpc} = require('./config')
const signers = require('../fixtures/signers')

// always use the same private key and subplebbit address when testing
const privateKey = signers[0].privateKey

// set up a subplebbit for testing
;(async () => {
  await startIpfs(offlineIpfs)
  await startIpfs(pubsubIpfs)
  await startPlebbitRpc({port: plebbitRpc.port, ipfsApiPort: offlineIpfs.apiPort, pubsubApiPort: pubsubIpfs.apiPort})

  const plebbitOptions = {
    ipfsHttpClientsOptions: [`http://127.0.0.1:${offlineIpfs.apiPort}/api/v0`],
    pubsubHttpClientsOptions: [`http://127.0.0.1:${pubsubIpfs.apiPort}/api/v0`],
    // pubsubHttpClientsOptions: [`https://pubsubprovider.xyz/api/v0`],
    dataPath: plebbitDataPath,
    publishInterval: 1000,
    updateInterval: 1000,
  }

  const plebbit = await Plebbit(plebbitOptions)
  const plebbit2 = await Plebbit(plebbitOptions)
  const signer = await plebbit.createSigner({privateKey, type: 'ed25519'})

  console.log(`creating subplebbit with address '${signer.address}'...`)
  const subplebbit = await plebbit.createSubplebbit({
    signer: signer,
  })
  subplebbit.on('challengerequest', console.log)
  subplebbit.on('challengeanswer', console.log)
  await subplebbit.edit({settings: {challenges: [{name: 'question', options: {question: '1+1=?', answer: '2'}}]}})
  console.log('subplebbit created')

  console.log('starting subplebbit...')
  await subplebbit.start()
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
      .createServer((req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.end('test server ready')
      })
      .listen(59281)
  })
})()
