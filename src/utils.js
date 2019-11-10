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

const parsers = new Map();

export function parse(str, loose) {
  let arr = str.split(/\/+/);
	arr[0] || arr.shift();
  let key = `${arr.join('/')}:${!!loose}`;
  if (parsers.has(key)) return parsers.get(key);
	let c, o, tmp, ext, keys=[], pattern='';

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
  parsers.set(key, (route) => exec(route, config))
	return parsers.get(key)
}


export class Router {
  constructor() {
    this.routes = []
  }

  add(middleware, route, handler) {
    const match = parse(route, middleware)
    const data = {
      match,
      middleware,
      handler
    }
    this.routes.push(data)
    return () => {
      let index = this.routes.indexOf(data);
      if (index > -1) {
        this.routes.splice(index, 1);
      }
    };
  }

  find(route) {
		let i=0, tmp, arr=this.routes, handlers=[], just_middleware=true;
		for (; i < arr.length; i++) {
      tmp = arr[i];
      let match = tmp.match(route)
      if (match) {
        just_middleware = just_middleware && tmp.middleware
        handlers.push({params: match, handler: tmp.handler})
      }
		}
		return just_middleware ? [] : handlers;
	}
}