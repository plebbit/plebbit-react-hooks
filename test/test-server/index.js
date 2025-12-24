// script to start IPFS and plebbit-js for testing

import {offlineIpfs, pubsubIpfs, plebbitRpc} from './config.js'
import startIpfs from './start-ipfs.js'
import startPlebbitRpc from './start-plebbit-rpc.js'
import signers from '../fixtures/signers.js'
import {directory as getTmpFolderPath} from 'tempy'
import http from 'http'
import fs from 'fs'
import path from 'path'
import {fileURLToPath} from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
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

  // Create a signer for testing ENS domain address editing
  // The 'my-sub.eth' domain should resolve to this signer's address
  const ensTestSigner = await plebbit.createSigner()
  const ensTestDomain = 'my-sub.eth'

  // Mock the ENS text record for 'my-sub.eth' to point to ensTestSigner.address
  // This allows the test to successfully edit a subplebbit's address to 'my-sub.eth'
  const cacheKey = plebbit._clientsManager._getKeyOfCachedDomainTextRecord(ensTestDomain, 'subplebbit-address')
  const timestamp = () => Math.floor(Date.now() / 1000)
  await plebbit._storage.setItem(cacheKey, {
    timestampSeconds: timestamp(),
    valueOfTextRecord: ensTestSigner.address,
  })
  console.log(`Mocked ENS text record '${ensTestDomain}' -> '${ensTestSigner.address}'`)

  // Export the ENS test signer info to a file so tests can use it
  const ensTestSignerInfo = {
    privateKey: ensTestSigner.privateKey,
    address: ensTestSigner.address,
    type: ensTestSigner.type,
    domain: ensTestDomain,
  }
  const signerInfoPath = path.join(__dirname, 'ens-test-signer.json')
  fs.writeFileSync(signerInfoPath, JSON.stringify(ensTestSignerInfo, null, 2))
  console.log(`Exported ENS test signer info to '${signerInfoPath}'`)

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
        if (req.url === '/ens-test-signer') {
          // Return the ENS test signer info for browser tests
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(ensTestSignerInfo))
        } else {
          res.end('test server ready')
        }
      })
      .listen(59281)
  })
})()
