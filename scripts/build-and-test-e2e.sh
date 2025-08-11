#!/usr/bin/env bash

# build and bundle
yarn
yarn build

# wait until test server is ready
yarn test:server & yarn test:server:wait-on

# tests
CHROME_BIN=$(which chrome || which chromium || which chromium-browser) yarn test:e2e

# close test server
kill `pgrep --full  'node test/test-server'`
# close ipfs daemons
kill `pgrep --full  'ipfs daemon'`
