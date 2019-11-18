const fs = require('fs');
const path = require('path');
const pkg = require('../package.json');
const templates = require('./templates');

function filename(file) {
	return file.replace(path.extname(file), '')
}

function remove_root(route, root) {
	return route.replace(root, '')
}

function camelRoute(route) {
	return route
		.replace('$', '')
		.replace(/\/([a-z])?/g, (m, $1) => {
			return $1 ? $1.toUpperCase() : ''
		})
		.replace(/^([a-z])/, (_, $1) => $1.toUpperCase())
}

function get_routes(folder, parentname = '', parentpath = '') {
	const files = fs.readdirSync(folder)
	return [].concat(files.reduce((acc, file) => {
		let name = filename(file)
		if (file.indexOf('_') == 0 || !name.match(/^\$?[a-z_-]+!?$/i)) {
			return acc
		}
		const full_name = `${parentname}${name}`.replace('!', '')
		const route_path = name
			.replace(/^(index|!)$/gi, '')
			.replace(/\$/g, ':')
		const stats = fs.lstatSync(path.join(folder, file))
		if (stats.isDirectory()) {
			const routes = get_routes(path.join(folder, file), name, route_path)
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

function parse_routes(routes, root, key = '') {
	const imports = []
	const scripts = []
	const render = []
	routes.map((route) => {
		console.log(route)
		switch(route.type) {

		}
	})
	if (routes['$layout']) {
		const location = routes['$layout']
		const name = camelRoute(filename(remove_root(location, root))).replace('$l', 'L')
		imports.push(`import ${name} from "${location}";`)
		start.push(`<Middleware path="${key.replace('index', '').replace(/\$/g, ':')}" component="{${name}}" props="{${name}_props}">`)
		end.unshift(`</Middleware>`)
		scripts.push(`export let ${name}_props = null;`)
		const { $layout, ...rest } = routes;
		routes = rest
	}
	const res = Object.keys(routes).reduce(({imports, render, scripts}, routeKey) => {
		if (typeof routes[routeKey] === 'string') {
			const location = routes[routeKey]
			const name = camelRoute(filename(remove_root(location, root)))
			const route = routeKey.replace('index', '').replace(/\$/g, ':')
			imports.push(`import ${name} from "${location}";`)
			scripts.push(`export let ${name}_props = null;`)
			render.push(`<Route path="${route}" component="{${name}}" props="{${name}_props}" />`)
		} else {
			const res = parse_routes(routes[routeKey], root, routeKey)
			imports.push(...res.imports)
			render.push(...res.render)
			scripts.push(...res.scripts)
		}
		return { imports, render, scripts }
	}, { imports, render, scripts })
	res.render.push(...end)
	return res
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
			console.log(JSON.stringify(routes, null, 2))

			const { imports, render, scripts } = parse_routes(routes)
			const ret = [
				'<script>',
				`import { Route, Router, Middleware, AsyncComponent } from '${pkg.name}';`,
				...imports,
				'export let location;',
				'export let data;',
				'export let history;',
				'',
				...scripts,
				'</script>',
				'<Router {location} {data} {history} >',
				...render,
				'</Router>'
			].join('\n')
			console.log(imports)
			return ret
		}
	}
}
