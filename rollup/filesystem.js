import fs from 'fs';
import path from 'path';
import pkg from '../package.json';

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

function get_routes(folder) {
	const files = fs.readdirSync(folder)
	return files.reduce((acc, file) => {
		const name = filename(file)
		if (file.indexOf('_') == 0 || !name.match(/^\$?[a-z_-]+$/i)) {
			return acc
		}
		const stats = fs.lstatSync(path.join(folder, file))
		if (stats.isDirectory()) {
			const routes = get_routes(path.join(folder, file))
			if (routes['$layout']) {
				acc[name] = routes
			} else {
				for (let key in routes) {
					acc[`${name}/${key}`] = routes[key]
				}
			}
		} else {
			acc[name] = path.join(folder, file)
		}
		return acc
	}, {});
}

function parse_routes(routes, root, key = '') {
	const imports = []
	const start = []
	const end = []
	if (routes['$layout']) {
		const location = routes['$layout']
		const name = camelRoute(filename(remove_root(location, root))).replace('$l', 'L')
		imports.push(`import ${name} from "${location}";`)
		start.push(`<Route ${key ? `path="${key}" ` : ''}component="{${name}}">`)
		end.unshift(`</Route>`)
		const { $layout, ...rest } = routes;
		routes = rest
	}
	const res = Object.keys(routes).reduce(({imports, render}, routeKey) => {
		if (typeof routes[routeKey] === 'string') {
			const location = routes[routeKey]
			const name = camelRoute(filename(remove_root(location, root)))
			const route = remove_root(filename(location), root).replace('index', '')
			imports.push(`import ${name} from "${location}";`)
			render.push(`<Route ${route ? `path="${route}" ` : ''}component="{${name}}" exact/>`)
		} else {
			const res = parse_routes(routes[routeKey], root, routeKey)
			imports.push(...res.imports)
			render.push(...res.render)
		}
		return { imports, render }
	}, { imports, render: start })
	res.render.push(...end)
	return res
}

export default function SvelteFileRouter({
  rootDir = './src/routes',
  virtual = `${pkg.name}/Routes.svelte`
} = {}) {
	rootDir = path.join(process.cwd(), rootDir)

	return {
		name: 'svelte-file-router',
		resolveId(id) {
			if (id === virtual) {
				return id
			}
			return null
		},
		load(id) {
			if (id !== virtual) return null
			const routes = get_routes(rootDir)
			const { imports, render } = parse_routes(routes, rootDir)
			const ret = [
				'<script>',
				`import { Route, Router } from '${pkg.name}';`,
				...imports,
				'export let location;',
				'export let data;',
				'export let history;',
				'</script>',
				'<Router {location} {data} {history} >',
				...render,
				'</Router>'
			].join('\n')
			console.log(ret)
			return ret
		}
	}
}
