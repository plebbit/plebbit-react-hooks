module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  rootDir: '../src',

  /* no need for ignore when only testing rootDir ../src
     might change later to include some tests in ../test
  testPathIgnorePatterns: [
    '<rootDir>/dist', 
    // e2e tests are run in the browser with karma
    // not with jest and jsdom
    '<rootDir>/test/e2e/'], */

  globals: {
    'ts-jest': {
      tsconfig: 'config/tsconfig.json',
    },
  },
}
