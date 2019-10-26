import svelte from 'rollup-plugin-svelte';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import { join } from 'path'

export default {
	input: 'cypress/site/app/index.js',
	output: {
		sourcemap: true,
		format: 'iife',
		name: 'app',
		file: 'cypress/site/bundle.js'
	},
	plugins: [
		{
			resolveId(mod) {
				if (mod === 'svelte-router') {
					return join(process.cwd(), 'src', 'index.js')
				}
				return null
			}
		},
		svelte({
			immutable: true,
			hydratable: true,
		}),
		resolve({
			browser: true,
		}),
		commonjs(),
		terser()
	]
};
