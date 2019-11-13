const fs = require('fs');
const path = require('path');
const pkg = require('../package.json');

function filename(file) {
	return file.replace(path.extname(file), '')
}

function remove_root(route, root) {
	return route.replace(root, '')
}

function camelRoute(route) {
	return route
		.replace('$' , '')
		.replace(/\/([a-z])?/g, (m, $1) => {
			return $1 ? $1.toUpperCase() : ''
		})
		.replace(/^([a-z])/, (_, $1) => $1.toUpperCase())
}

function get_routes(folder, parent = '') {
	const files = fs.readdirSync(folder)
	return files.reduce((acc, file) => {
		const name = filename(file)
		if (file.indexOf('_') == 0 || !name.match(/^\$?[a-z_-]+$/i)) {
			return acc
		}
		const stats = fs.lstatSync(path.join(folder, file))
		if (stats.isDirectory()) {
			const routes = get_routes(path.join(folder, file), name)
			// console.log(routes)
			if (routes['$layout']) {
				routes['$layout'].path = name.replace('index', '').replace(/\$/g, ':')
				acc.push(routes)
			} else {
				acc.push(...routes.map((route) => {
					route.path = `${name.replace('index', '').replace(/\$/g, ':')}/${route.path}`
					return route
				}))
			}
		} else if (name.match(/\$layout$/i)) {
			acc['$layout'] = {
				file: path.join(folder, file),
				name: `${parent}${name}`.replace('$', ''),
				path: ''
			}
		} else {
			acc.push({
				file: path.join(folder, file),
				name: `${parent}${name}`.replace('$', ''),
				path: name.replace('index', '').replace(/\$/g, ':'),
			})
		}
		return acc
	}, []);
}

function parse_routes(routes, root, key = '') {
	const imports = []
	const scripts = []
	const start = []
	const end = []
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
	}, { imports, render: start, scripts })
	res.render.push(...end)
	return res
}

module.exports = function SvelteFileRouter({
  rootDir = './src/routes',
  virtual = `${pkg.name}/Routes.svelte`
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
			const { imports, render, scripts } = parse_routes(routes, rootDir)
			const ret = [
				'<script>',
				`import { Route, Router, Middleware } from '${pkg.name}';`,
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
