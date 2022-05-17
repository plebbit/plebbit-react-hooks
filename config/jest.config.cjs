module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  rootDir: '..',
  testPathIgnorePatterns: ['dist'],
  globals: {
    "ts-jest": {
      "tsconfig": "config/tsconfig.json"
    }
  }
}
