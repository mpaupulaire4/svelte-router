// import { parse } from 'qs';
import { writable } from 'svelte/store';

// export const qsparse = (search) => {
//   return parse(search, {
//     ignoreQueryPrefix: true,
//     plainObjects: true
//   })
// }

export function which(event) {
  return event.which === null ? event.button : event.which;
}

export function find_anchor(node) {
  while (node && node.nodeName.toUpperCase() !== 'A')
    node = node.parentNode; // SVG <a> elements have a lowercase name
  return node;
}

export function debounce(callback, time = 100) {
  let timer;
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => callback(...args), time)
  }
}

export function get_href(node) {
  // check if link is inside an svg
  // in this case, both href and target are always inside an object
  const svg = typeof node.href === 'object' && node.href.constructor.name === 'SVGAnimatedString';
  return String(svg ? (node).href.baseVal : node.href);
}

function exec(path, result) {
  const matches = result.pattern.exec(path);
  if (!matches || !result.keys) return matches;
  let i=0, out={};
  while (i < result.keys.length) {
    out[ result.keys[i] ] = matches[++i] || null;
  }
  return out;
}

export function parse(str, loose) {
	if (str instanceof RegExp) {
    return (route) => exec(route, { keys:false, pattern: str });
  }
	var c, o, tmp, ext, keys=[], pattern='', arr = str.split(/\/+/);
	arr[0] || arr.shift();

	while (tmp = arr.shift()) {
		c = tmp[0];
		if (c === '*') {
			keys.push('wild');
			pattern += '/(.*)';
		} else if (c === ':') {
			o = tmp.indexOf('?', 1);
			ext = tmp.indexOf('.', 1);
			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
		} else {
			pattern += '/' + tmp;
		}
	}
  const config = {
    keys,
    pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
  };
	return (route) => exec(route, config)
}
