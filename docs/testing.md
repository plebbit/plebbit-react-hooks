#### Install

- `yarn`

#### Unit tests

> Unit tests use jest and jsom and are placed next to the file they are testing, e.g. accounts.ts and accounts.test.ts. They also use a mock of plebbit-js because it doesn't work in jsdom.

- `yarn test`

#### Unit tests with logs

```
DEBUG=* yarn test
DEBUG=plebbit-react-hooks:* yarn test
DEBUG=plebbit-react-hooks:hooks:* yarn test
DEBUG=plebbit-react-hooks:hooks:accounts yarn test
DEBUG=plebbit-react-hooks:hooks:accounts DEBUG_DEPTH=6 yarn test feeds
```

#### Preapre for E2E tests

> E2E tests use karma and mocha and are placed in /test/browser (for mocked plebbit-js) and /test/e2e (for real plebbit-js).

- Create a `.env` file and add `CHROME_BIN=/usr/bin/chromium` (replace the path with your chrome path)
- In a new terminal run `yarn build:watch` to compile typescript
- In a new terminal run `yarn webpack:watch` to compile the browser tests
- In a new terminal run `yarn test:server` to start an ipfs node and the test subplebbits

#### E2E tests

- `yarn test:e2e`
- `DEBUG=plebbit-react-hooks:* yarn test:e2e` for tests with logs

#### Build

- `yarn build`
