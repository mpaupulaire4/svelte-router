import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  resolve: {
    dedupe: ['svelte'],
    alias: {
      lib: resolve(__dirname, './lib'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, './lib/index.ts'),
      name: 'SvelteRouter',
      formats: ['es', 'cjs'],
      // the proper extensions will be added
      fileName: 'svelte-router'
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: [
        "@crikey/stores-base-queue",
        "@crikey/stores-strict",
        "regexparam",
        "svelte",
      ],
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    // includeSource: ['lib/**/*.{js,ts,svelte}'],
  }
})
