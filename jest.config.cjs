module.exports = {
    preset: 'ts-jest/presets/js-with-babel-esm',
    transform: {},
    testEnvironment: 'jsdom',
    testPathIgnorePatterns: ['dist'],
    globals: {
        'ts-jest': {
            useESM: true,
        },
    },
    setupFilesAfterEnv: ['<rootDir>/testSetupFile.js'],
}
