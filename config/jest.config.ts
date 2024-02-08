import type {JestConfigWithTsJest} from 'ts-jest'
const config: JestConfigWithTsJest = {
  preset: 'ts-jest/presets/default-esm',
  verbose: true,
  resolver: '../config/jest.resolver.cjs', // need to use custom resolver cause otherwise it would use dist/node
  // resolver: "enhanced-resolve-jest",
  // "resolver": "@financial-times/jest-browser-resolver",
  testEnvironment: 'jsdom',
  rootDir: '../src',
  setupFilesAfterEnv: ['../config/jest.setup.cjs'],
  transformIgnorePatterns: ['node_modules/(?!(uuid|uint8arrays|@plebbit/plebbit-js)/)'],
  extensionsToTreatAsEsm: ['.ts'],

  /* no need for ignore when only testing rootDir ../src
     might change later to include some tests in ../test
  testPathIgnorePatterns: [
    '<rootDir>/dist', 
    // e2e tests are run in the browser with karma
    // not with jest and jsdom
    '<rootDir>/test/e2e/'], */

  // transform: {},
  transform: {
    // '^.+\\.[tj]sx?$' to process js/ts with `ts-jest`
    // '^.+\\.m?[tj]sx?$' to process js/ts/mjs/mts with `ts-jest`
    '^.+\\.(j|t)sx?$': [
      'ts-jest',
      {
        tsconfig: 'config/tsconfig.json',
        useESM: true,
        allowJs: true,
        supportsStaticESM: true,
      },
    ],
  },
}

export default config
