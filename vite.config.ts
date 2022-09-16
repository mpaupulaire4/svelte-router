import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import typescript from '@rollup/plugin-typescript';

const resolvePath = (path: string) => resolve(__dirname, path);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svelte({ hot: !process.env.VITEST && process.env.NODE_ENV !== 'production' }),
  ],
  resolve: {
    dedupe: ['svelte'],
    alias: {
      lib: resolvePath('./lib'),
    },
  },
  build: {
    lib: {
      entry: resolvePath('./lib/index.ts'),
      name: 'SvelteRouter',
      formats: ['es', 'cjs'],
      // the proper extensions will be added
      fileName: 'svelte-router',
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: [
        '@crikey/stores-base-queue',
        '@crikey/stores-strict',
        'regexparam',
        'svelte',
      ],
      plugins: [
        typescript({
          target: 'ESNEXT',
          rootDir: resolvePath('./lib'),
          declaration: true,
          declarationDir: resolvePath('./dist'),
        }),
      ],
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    // includeSource: ['lib/**/*.{js,ts,svelte}'],
  },
});
