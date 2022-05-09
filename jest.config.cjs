module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['dist', 'test/e2e'],
  setupFilesAfterEnv: ['./jest.setup.js']
}
