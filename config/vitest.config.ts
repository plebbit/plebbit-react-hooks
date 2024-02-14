/// <reference types="vitest" />
import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    name: 'test src files',
    environment: 'jsdom',
    root: 'src/',
    setupFiles: ['../config/vitest.setup.cjs'],
  },
})
