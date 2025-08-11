// script to start IPFS and plebbit-js for testing

import {offlineIpfs, pubsubIpfs, plebbitRpc} from './config.js'
import startIpfs from './start-ipfs.js'
import startPlebbitRpc from './start-plebbit-rpc.js'
import signers from '../fixtures/signers.js'
import {directory as getTmpFolderPath} from 'tempy'
import http from 'http'
const plebbitDataPath = getTmpFolderPath()

// set up a subplebbit for testing
;(async () => {
  // always use the same private key and subplebbit address when testing
  const privateKey = signers[0].privateKey
  const adminRoleAddress = signers[1].address

  await startIpfs(offlineIpfs)
  await startIpfs(pubsubIpfs)
  await startPlebbitRpc({
    port: plebbitRpc.port,
    ipfsApiPort: offlineIpfs.apiPort,
    pubsubApiPort: pubsubIpfs.apiPort,
  })

  const plebbitOptions = {
    kuboRpcClientsOptions: [`http://127.0.0.1:${offlineIpfs.apiPort}/api/v0`],
    pubsubKuboRpcClientsOptions: [`http://127.0.0.1:${pubsubIpfs.apiPort}/api/v0`],
    httpRoutersOptions: [],
    // pubsubKuboRpcClientsOptions: [`https://pubsubprovider.xyz/api/v0`],
    dataPath: plebbitDataPath,
    publishInterval: 1000,
    updateInterval: 1000,
  }

  const {default: Plebbit} = await import('@plebbit/plebbit-js')
  const plebbit = await Plebbit(plebbitOptions)
  // TODO: dataPath: getTmpFolderPath() should not be needed, plebbit-js bug
  const plebbit2 = await Plebbit({
    ...plebbitOptions,
    dataPath: getTmpFolderPath(),
  })
  const signer = await plebbit.createSigner({privateKey, type: 'ed25519'})

  console.log(`creating subplebbit with address '${signer.address}'...`)
  const subplebbit = await plebbit.createSubplebbit({
    signer: signer,
  })
  subplebbit.on('challengerequest', console.log)
  subplebbit.on('challengeanswer', console.log)
  await subplebbit.edit({
    settings: {
      challenges: [{name: 'question', options: {question: '1+1=?', answer: '2'}}],
    },
    roles: {[adminRoleAddress]: {role: 'admin'}},
  })
  console.log('subplebbit created')

  // tests can cause subplebbit errors, e.g. changing name to wrong .eth
  subplebbit.on('error', console.log)

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
    http
      .createServer((req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.end('test server ready')
      })
      .listen(59281)
  })
})()
