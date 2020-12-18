const svelte = require('rollup-plugin-svelte');
const { nodeResolve: resolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
import { terser } from 'rollup-plugin-terser';
const typescript = require('@rollup/plugin-typescript');
const config = require('./svelte.config');
const pkg = require('./package.json')

const production = !process.env.ROLLUP_WATCH;

module.exports = {
	input: 'src/index.ts',
	output: [
		{ file: pkg.module, format: 'es' },
		{ file: pkg.main, format: 'umd', name: 'SvelteRouter', plugins: [terser()] },
	],
	plugins: [
		svelte(config),

		// If you have external dependencies installed from
		// npm, you'll most likely need these plugins. In
		// some cases you'll need additional configuration -
		// consult the documentation for details:
		// https://github.com/rollup/plugins/tree/master/packages/commonjs
		resolve({
			browser: true,
			dedupe: ['svelte']
		}),
		commonjs(),
		typescript({ sourceMap: !production }),
	],
	watch: {
		clearScreen: false
	}
};
