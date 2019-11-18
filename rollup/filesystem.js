const fs = require('fs');
const path = require('path');
const { compile } = require('svelte/compiler')
const pkg = require('../package.json');
const templates = require('./templates');

function filename(file) {
	return file.replace(path.extname(file), '')
}

function get_routes(folder, parentname = '', parentpath = '') {
	const files = fs.readdirSync(folder)
	return [].concat(files.reduce((acc, file) => {
		let name = filename(file)
		if (file.indexOf('_') == 0 || !name.match(/^\$?[a-z_-]+!?$/i)) {
			return acc
		}
		const full_name = `${parentname}$${name}`
			.replace(/\$+([a-z])/g, (_, $1) => $1.toUpperCase())
			.replace('!', '')
		const route_path = name
			.replace(/(^index|!)$/g, '')
			.replace(/\$/g, ':')
			.toLowerCase()
		const stats = fs.lstatSync(path.join(folder, file))
		if (stats.isDirectory()) {
			const routes = get_routes(path.join(folder, file), full_name, route_path)
			if (routes.type === 'middleware') {
				[].push.call((acc.children || acc), routes)
			} else {
				[].push.call((acc.children || acc), ...routes.map((route) => {
					route.path = `${route_path}/${route.path}`
					return route
				}))
			}
		} else if (name.match(/^\$layout$/i)) {
			return {
				type: 'middleware',
				split: !!name.match(/!$/),
				file: path.join(folder, file),
				name: full_name,
				path: parentpath,
				children: acc
			}
		} else {
			[].push.call((acc.children || acc), {
				type: 'route',
				split: !!name.match(/!$/),
				file: path.join(folder, file),
				name: full_name,
				path: route_path,
			})
		}
		return acc
	}, []));
}

function parse_routes(routes, ssr = false) {
	const imports = []
	const scripts = []
	const render = []
	routes.forEach((route) => {
		const template = ssr ?
			templates.ssr :
			route.split ?
				templates.client_split :
				templates.client
		imports.push(template.imports(route))
		scripts.push(template.scripts(route))
		if (route.children && route.children.length) {
			const children = parse_routes(route.children);
			imports.push(children.imports)
			scripts.push(children.scripts)
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
		render: render.join('\n')
	}
}

module.exports = function SvelteFileRouter({
  rootDir = './src/routes',
	virtual = `${pkg.name}/Routes.svelte`,
	ssr = false,
} = {}) {
	rootDir = path.join(process.cwd(), rootDir)

	return {
		name: 'svelte-file-router',
		resolveId(id) {
			return id === virtual ? id : null
		},
		load(id) {
			if (id !== virtual) return null
			const routes = get_routes(rootDir)
			const { imports, render, scripts } = parse_routes(routes)
			const ret = [
				'<script>',
				`import { Route, Router, Middleware, AsyncComponent } from '${pkg.name}';`,
				imports,
				'',
				'export let location;',
				'export let history;',
				'',
				scripts,
				'</script>',
				'<Router {location} {history} >',
				render,
				'</Router>'
			].join('\n')
			console.log(ret)
			return ret;
		}
	}
}
