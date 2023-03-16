// the test server can crash without logs, this script adds logs when this happens

const fetch = require('node-fetch')
const {offlineIpfs, pubsubIpfs} = require('./ipfs-config')

const fetchText = async (url) => {
  let text
  try {
    text = await fetch(url, {cache: 'no-cache'}).then((res) => res.text())
  } catch (e) {}
  return text
}

// make sure only one instance is running in node
let started = false
const startMonitoring = () => {
  if (started) {
    return
  }
  started = true

  // log when the test server crashes
  setInterval(async () => {
    const text = await fetchText('http://localhost:59281')
    if (text === 'test server ready') {
      return
    }
    console.error('test server crashed http://localhost:59281')
  }, 200).unref?.()

  // log when ipfs crashes
  setInterval(async () => {
    const text = await fetchText(`http://localhost:${offlineIpfs.gatewayPort}/ipfs/QmQPeNsJPyVWPFDVHb77w8G42Fvo15z4bG2X8D2GhfbSXc/readme`)
    if (text && text.startsWith('Hello and Welcome to IPFS')) {
      return
    }
    console.error(`test server crashed offline ipfs daemon http://localhost:${offlineIpfs.gatewayPort}`)
  }, 200).unref?.()

  // log when pubsub ipfs crashes
  setInterval(async () => {
    const text = await fetchText(`http://localhost:${pubsubIpfs.gatewayPort}/ipfs/QmQPeNsJPyVWPFDVHb77w8G42Fvo15z4bG2X8D2GhfbSXc/readme`)
    if (text && text.startsWith('Hello and Welcome to IPFS')) {
      return
    }
    console.error(`test server crashed pubsub ipfs daemon http://localhost:${offlineIpfs.gatewayPort}`)
  }, 200).unref?.()
}

// make sure only one instance is running in karma
try {
  if (!window.PLEBBIT_PROTOCOL_TEST_MONITOR_TEST_SERVER_STARTED) {
    startMonitoring()
  }
  window.PLEBBIT_PROTOCOL_TEST_MONITOR_TEST_SERVER_STARTED = true
} catch (e) {}
startMonitoring()
