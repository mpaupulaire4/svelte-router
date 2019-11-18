const fs = require('fs');
const path = require('path');
const { compile } = require('svelte/compiler')
const pkg = require('../package.json');
const templates = require('./templates');

function filename(file) {
	return file.replace(path.extname(file), '')
}

function isPrefetchVar(var_meta) {
	return (
		var_meta.export_name === 'prefetch' &&
		var_meta.module &&
		!var_meta.writable
	)
}

function get_routes(folder, extensions = [], parentname = '', parentpath = '') {
	const files = fs.readdirSync(folder)
	return files.reduce((acc, file) => {
		let name = filename(file)
		if (
			file.indexOf('_') == 0 ||
			!name.match(/^\$?[a-z_-]+!?$/i)
		) {
			return acc
		}
		const full_name = `${parentname}$${name}`
			.replace(/\$+([a-z])/g, (_, $1) => $1.toUpperCase())
			.replace('!', '')
		const route_path = name
			.replace(/(^index|!)$/g, '')
			.replace(/\$/g, ':')
			.toLowerCase()
		const split = !!name.match(/!$/);
		const stats = fs.lstatSync(path.join(folder, file))
		if (stats.isDirectory()) {
			const routes = get_routes(path.join(folder, file), extensions, full_name, route_path)
			if (routes.type === 'middleware') {
				routes.split = split || routes.split;
				[].push.call((acc.children || acc), routes)
			} else {
				[].push.call((acc.children || acc), ...routes.map((route) => {
					route.path = `${route_path}/${route.path}`
					route.split = split || route.split
					return route
				}))
			}
		} else if (extensions.includes(path.extname(file))) {
			const file_path = path.join(folder, file);
			const hasPrefetch = compile(
				fs.readFileSync(file_path, 'utf8'),
				{generate: false}
			).vars.some(isPrefetchVar);
			if (name.match(/^\$layout$/i)) {
				return {
					type: 'middleware',
					split,
					hasPrefetch,
					file: file_path,
					name: full_name,
					path: parentpath,
					children: acc
				}
			}
			[].push.call((acc.children || acc), {
				type: 'route',
				split,
				hasPrefetch,
				file: file_path,
				name: full_name,
				path: route_path,
			})
		}
		return acc
	}, []);
}

function parse_routes(routes, ssr = false) {
	const imports = []
	const scripts = []
	const render = []
	let hasSplits = false
	let hasPrefetches = false
	routes.forEach((route) => {
		hasPrefetches = hasPrefetches || route.hasPrefetch
		const template = ssr ?
			templates.ssr :
			route.split ?
				templates.client_split :
				templates.client
		imports.push(template.imports(route))
		scripts.push(template.scripts(route))
		hasSplits = route.split || hasSplits
		if (route.children && route.children.length) {
			const children = parse_routes(route.children, ssr);
			imports.push(children.imports)
			scripts.push(children.scripts)
			hasSplits = children.hasSplits || hasSplits
			hasPrefetches = hasPrefetches || children.hasPrefetches
			render.push(
				template.middleware({
					...route,
					children: children.render
				})
			)
		} else {
			render.push(template.route(route))
		}
	})
	return {
		imports: imports.join('\n'),
		scripts: scripts.join('\n'),
		render: render.join('\n'),
		hasPrefetches,
		hasSplits: !ssr && hasSplits
	}
}

module.exports = function SvelteFileRouter({
  rootDir = './src/routes',
	virtual = `${pkg.name}/Routes.svelte`,
	ssr = false,
	extensions = ['.svelte', '.html']
} = {}) {
	rootDir = path.resolve(rootDir)
	return {
		name: 'svelte-file-router',
		resolveId(id) {
			return id === virtual ? id : null
		},
		load(id) {
			if (id !== virtual) return null
			const routes = [].concat(get_routes(rootDir, extensions));
			const { imports, render, scripts, hasSplits, hasPrefetches } = parse_routes(routes, ssr)
			return [
				'<script>',
				`import { Route, Router, Middleware\
${hasSplits ? ', AsyncComponent' : '' }\
${hasPrefetches ? ', register_preload' : '' }\
 } from '${pkg.name}';`,
				imports,
				'',
				'export let location = undefined;',
				'export let history = undefined;',
				'',
				scripts,
				'</script>',
				'<Router {location} {history} >',
				render,
				'</Router>'
			].join('\n');
		}
	}
}
