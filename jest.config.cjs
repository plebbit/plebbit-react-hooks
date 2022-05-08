module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['dist'],
  setupFilesAfterEnv: ['./jest.setup.js']
}
