import fs, { Dirent } from 'fs';
import path from 'path';
import { compile } from 'svelte/compiler'
import pkg from '../package.json';
import * as templates from './templates';

function filename(file: Dirent) {
	return file.name.replace(path.extname(file.name), '')
}

// function isPrefetchVar(var_meta) {
// 	return (
// 		var_meta.export_name === 'prefetch' &&
// 		var_meta.module &&
// 		!var_meta.writable
// 	)
// }

interface FSRoute {
  file: string
  name: string
  path: string
  routes?: FSRoute[]
}


export function createFolderParser(extensions: string[]) {
  return function getRoutesFromPath(
    folder: string,
    parentname: string = '',
    parentpath: string = ''
  ): FSRoute[]  {
    const files = fs.readdirSync(folder, { withFileTypes: true })
    return files.reduce((acc: FSRoute[], file) => {
      let name = filename(file)
      if (
        file.name.startsWith('_') ||
        !name.match(/^\$?[a-z_-]+!?$/i)
      ) {
        return acc
      }
      const full_name = `${parentname}$${name}`
        .replace(/\$+([a-z])/gi, (_, $1) => $1.toUpperCase())
        .replace('!', '')
      const route_path = name
        .replace(/(^index|!)$/gi, '')
        .replace(/^\$/g, ':')
        .toLowerCase()
      const split = !!name.match(/!$/);
      if (file.isDirectory()) {
        const routes = getRoutesFromPath(path.join(folder, file.name), full_name, route_path)
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
      } else if (extensions.includes(path.extname(file.name))) {
        const file_path = path.join(folder, file.name);
        // const hasPrefetch = compile(
        //   fs.readFileSync(file_path, 'utf8'),
        //   {generate: false}
        // ).vars.some(isPrefetchVar);
        // if (name.match(/^\$layout$/i)) {
        //   return {
        //     type: 'middleware',
        //     split,
        //     hasPrefetch,
        //     file: file_path,
        //     name: full_name,
        //     path: parentpath,
        //     children: acc
        //   }
        // }
        [].push.call((/* acc.rou || */ acc), {
          // split,
          // hasPrefetch,
          file: file_path,
          name: full_name,
          path: route_path,
        })
      }
      return acc
    }, [] as FSRoute[]);
  }
}
