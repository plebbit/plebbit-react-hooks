// the test server can crash without logs, this script adds logs when this happens
// you should also import assertTestServerDidntCrash and run it beforeEach and afterEach

const fetch = require('node-fetch')
const {offlineIpfs, pubsubIpfs} = require('./ipfs-config')

// make sure only one instance is running in node
let started = false
const startMonitoring = async () => {
  if (started) {
    return
  }
  started = true

  // log when test server or ipfs crashes
  setInterval(async () => {
    logTestServerCrashed()
  }, 200).unref?.()
}

// make sure only one instance is running in karma
try {
  if (!window.PLEBBIT_MONITOR_TEST_SERVER_STARTED) {
    startMonitoring()
  }
  window.PLEBBIT_MONITOR_TEST_SERVER_STARTED = true
} catch (e) {}
startMonitoring()

const logTestServerCrashed = async () => {
  try {
    await assertTestServerDidntCrash()
  } catch (e) {
    console.error(e.message)
  }
}

const assertTestServerDidntCrash = async () => {
  const testServerText = await fetchText('http://localhost:59281')
  if (testServerText !== 'test server ready') {
    throw Error('test server crashed http://localhost:59281')
  }
  const offlineIpfsText = await fetchText(`http://localhost:${offlineIpfs.gatewayPort}/ipfs/QmQPeNsJPyVWPFDVHb77w8G42Fvo15z4bG2X8D2GhfbSXc/readme`)
  if (!offlineIpfsText?.startsWith('Hello and Welcome to IPFS')) {
    throw Error(`test server crashed offline ipfs daemon http://localhost:${offlineIpfs.gatewayPort}`)
  }
  const pubsubIpfsText = await fetchText(`http://localhost:${pubsubIpfs.gatewayPort}/ipfs/QmQPeNsJPyVWPFDVHb77w8G42Fvo15z4bG2X8D2GhfbSXc/readme`)
  if (!pubsubIpfsText?.startsWith('Hello and Welcome to IPFS')) {
    throw Error(`test server crashed pubsub ipfs daemon http://localhost:${pubsubIpfs.gatewayPort}`)
  }
}

const fetchText = async (url) => {
  let text
  try {
    text = await fetch(url, {cache: 'no-cache'}).then((res) => res.text())
  } catch (e) {}
  return text
}

module.exports = {assertTestServerDidntCrash}
