/**
 * Repro script for the race condition between createSubplebbit and subplebbit.start().
 *
 * With old plebbit-js (8e7d818): createSubplebbit({address}) takes ~1000ms+
 *   because the internal stop() is slow, so the manual .start() after it succeeds.
 *
 * With new plebbit-js (6ea0b78): createSubplebbit({address}) returns near-instantly
 *   because stop() is fast, so a concurrent .start() from the auto-start interval
 *   races with the manual .start() and may fail with ERR_SUB_ALREADY_STARTED_IN_SAME_PLEBBIT_INSTANCE.
 *
 * Usage:
 *   1. Start the test server: node test/test-server/index.js
 *   2. Run this script:       node test/repro-race.mjs
 */

import Plebbit from '@plebbit/plebbit-js'

const RPC_URL = 'ws://127.0.0.1:48392'

async function main() {
  const plebbit = await Plebbit({plebbitRpcClientsOptions: [RPC_URL]})

  // Step 1: create a brand-new subplebbit so we have an address
  console.log('Creating a new subplebbit...')
  const created = await plebbit.createSubplebbit({title: 'race-repro'})
  const address = created.address
  console.log(`Created subplebbit: ${address}`)

  // Step 2: measure how long createSubplebbit({address}) takes
  // (internally it does subscribe -> update -> stop, the stop duration is what changed)
  const t0 = performance.now()
  const sub1 = await plebbit.createSubplebbit({address})
  const elapsed = performance.now() - t0
  console.log(`createSubplebbit({address}) took ${elapsed.toFixed(0)} ms`)

  // Step 3: simulate the race — immediately try to .start() on another instance
  try {
    const sub2 = await plebbit.createSubplebbit({address})
    await sub2.start()
    console.log('sub2.start() succeeded (no race condition)')
    await sub2.stop()
  } catch (err) {
    console.error(`sub2.start() FAILED: ${err.code || err.message}`)
  }

  // Cleanup
  try { await sub1.stop() } catch {}
  try { await created.stop() } catch {}
  await plebbit.destroy()
  console.log('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
