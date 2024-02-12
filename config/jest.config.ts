import type {JestConfigWithTsJest} from 'ts-jest'

const config: JestConfigWithTsJest = {
  verbose: true,
  testEnvironment: 'jsdom',
  rootDir: '../src',
  setupFilesAfterEnv: ['../config/jest.setup.cjs'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    uuid: require.resolve('uuid'), // Force module uuid to resolve with the CJS entry point, because Jest does not support package.json.exports. See https://github.com/uuidjs/uuid/issues/451
  },
  extensionsToTreatAsEsm: ['.jsx', '.ts', '.tsx', '.mts'],
  transform: {
    // '^.+\\.[tj]sx?$' to process js/ts with `ts-jest`
    // '^.+\\.m?[tj]sx?$' to process js/ts/mjs/mts with `ts-jest`
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        tsconfig: 'config/jest.tsconfig.json',
        useESM: true,
      },
    ],
  },
}

export default config
