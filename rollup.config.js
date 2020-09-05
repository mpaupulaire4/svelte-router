const svelte = require('rollup-plugin-svelte');
const { nodeResolve: resolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const livereload = require('rollup-plugin-livereload');
import { terser } from 'rollup-plugin-terser';
const typescript = require('@rollup/plugin-typescript');
const config = require('./svelte.config');
const pkg = require('./package.json')

const production = !process.env.ROLLUP_WATCH;

function serve() {
	let server;

	function toExit() {
		if (server) server.kill(0);
	}

	return {
		writeBundle() {
			if (server) return;
			server = require('child_process').spawn('npm', ['run', 'start', '--', '--dev', '--single'], {
				stdio: ['ignore', 'inherit', 'inherit'],
				shell: true
			});

			process.on('SIGTERM', toExit);
			process.on('exit', toExit);
		}
	};
}

module.exports = {
	input: !production ? 'test/main.ts' : 'src/index.ts',
	output: !production ? {
		sourcemap: true,
		format: 'iife',
		name: 'app',
		file: 'public/build/bundle.js'
	} : [
		{ file: pkg.module, format: 'es' },
		{ file: pkg.main, format: 'umd', name: 'SvelteRouter' },
		{ file: pkg.svelte, format: 'es' }
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

		production && terser(),
		// In dev mode, call `npm run start` once
		// the bundle has been generated
		!production && serve(),

		// Watch the `public` directory and refresh the
		// browser on changes when not in production
		!production && livereload('public'),
	],
	watch: {
		clearScreen: false
	}
};
