// the test server can crash without logs, this script adds logs when this happens
// you should also import assertTestServerDidntCrash and run it beforeEach and afterEach

import nodeFetch from 'node-fetch'
import {offlineIpfs, pubsubIpfs} from './config'

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
  const [testServerText, testServerError] = await fetchText('http://localhost:59281')
  if (testServerText !== 'test server ready') {
    throw Error('test server crashed http://localhost:59281: ' + testServerError?.message || '')
  }
  const [offlineIpfsText, offlineIpfsError] = await fetchText(`http://localhost:${offlineIpfs.gatewayPort}/ipfs/QmZULkCELmmk5XNfCgTnCyFgAVxBRBXyDHGGMVoLFLiXEN`)
  if (!offlineIpfsText?.startsWith('hello')) {
    throw Error(`test server crashed offline ipfs daemon http://localhost:${offlineIpfs.gatewayPort}: ` + offlineIpfsError?.message || '')
  }
  const [pubsubIpfsText, pubsubIpfsError] = await fetchText(`http://localhost:${pubsubIpfs.gatewayPort}/ipfs/QmZULkCELmmk5XNfCgTnCyFgAVxBRBXyDHGGMVoLFLiXEN`)
  if (!pubsubIpfsText?.startsWith('hello')) {
    throw Error(`test server crashed pubsub ipfs daemon http://localhost:${pubsubIpfs.gatewayPort}` + pubsubIpfsError?.message || '')
  }
}

const fetchText = async (url) => {
  let text, error
  try {
    text = await (window.navigator.userAgent.match(/electron/i) ? xmlHttpFetch(url) : nodeFetch(url, {cache: 'no-cache'})).then((res) => res.text())
  } catch (e) {
    error = e
  }
  return [text, error]
}

// use XMLHttpRequest because fetch is forbidden in electron tests
// keep xmlHttpFetch for Electron path only

const xmlHttpFetch = (url) =>
  new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest()
    xhr.open('GET', url)
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({text: async () => xhr.response})
      } else {
        reject(Error(`status code '${xhr.status}' text '${xhr.statusText}'`))
      }
    }
    xhr.onerror = () => reject(Error(`status code '${xhr.status}' text '${xhr.statusText}'`))
    xhr.send()
  })

export {assertTestServerDidntCrash}
