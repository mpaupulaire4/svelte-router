const { readdirSync } = require('fs');
const { extname, join } = require('path');
// const templates = require('./templates');

const COLISION = {
  APPEND: 'append',
  MIDDLEWARE: 'middleware',
}

function parse(file) {
  const ext = extname(file.name)
	return {
    name: file.name.replace(ext, ''),
    ext,
    dir: file.isDirectory()
  }
}

function get_routes(folder, extensions = [], colision, middleware = []) {
	const files = readdirSync(folder, { withFileTypes: true })
    .sort((a, b) => {
      if (a.isDirectory === b.isDirectory()) return 0;
      return a.isDirectory() ? -1 : 1
    })
  const middlewares = [];
  const cache = Object.create(null)
	const routes = files.flatMap((file) => {
    const pFile = parse(file)
    if (pFile.name.indexOf('_') == 0) return []
    if (!pFile.dir && !extensions.includes(pFile.ext)) return []
    const route_path = ('/' + pFile.name)
      .toLowerCase()
      .replace(/^\/index$/g, '')
    const full_file = join(folder, file.name)
    if (pFile.dir) {
      cache[pFile.name] = get_routes(join(folder, pFile.name), extensions, colision, middleware).map((r) => ({
        ...r,
        path: route_path + r.path,
      }))
      return cache[pFile.name]
    } else {
      if (middleware.includes(pFile.name)) {
        middlewares.push(full_file)
        return []
      }
      let found = false
      if (colision === COLISION.MIDDLEWARE && cache[pFile.name]) {
        cache[pFile.name].forEach((r) => {
          r.files = [full_file, ...r.files]
          if (r.path === route_path) {
            found = true
          }
        })
      }
      return found ? [] : {
        files: [full_file],
        path: route_path
      }
    }

	});
  return routes.map((r) => ({
    ...r,
    files: middleware.concat(r.files)
  }))
}

/**
 * @type {() => import('rollup').Plugin}
 */
module.exports = function SvelteFileRouter({
  rootDir = './src/routes',
	virtual = `@fs-routes`,
	extensions = ['.svelte', '.html'],
  toCode = (r) => JSON.stringify(r),
  colision = COLISION.APPEND
} = {}) {
	return {
    name: 'svelte-file-router',

    buildStart() {
      this.addWatchFile(rootDir)
    },

		resolveId(id) {
			return id === virtual ? id : null
		},
		async load(id) {
			if (id !== virtual) return null
			const code = get_routes(rootDir, extensions, colision)
        .map(toCode)
        .join(',');
      return `export default [${code}]`
		}
	}
}

// console.log(get_routes(path.resolve('../'), ['.svelte']))
