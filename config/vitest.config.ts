/// <reference types="vitest" />
import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    name: 'test src files',
    environment: 'happy-dom',
    root: 'src/',
    setupFiles: ['../config/vitest.setup.cjs'],
    // retry:  10,
    // testTimeout: 60000

    // ...
  },
})
