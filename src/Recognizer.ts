interface ParsedPart<T = any> {
  keys: string[]
  regex: RegExp
  params: number
  wilds: number
  statics: number
  meta?: T
}

const SEP = '/';

export function strip(str: string) {
	return str.replace(/^\/|\/$/g, '');
}

function match<T>(path: string, parts: ParsedPart<T>[]) {
	for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
		if (part.regex.test(path)) {
      return part
		}
	}
	return null;
}


function parse<T>(str: string, meta?: T): ParsedPart<T> {
  const arr = strip(str).split(SEP)
  const keys: string[] = []
  let tmp: string
  let pattern: string = ''
  let wilds = 0
  let params = 0
  let statics = 0
	while (tmp = arr.shift()) {
		let c = tmp[0];
    let o = tmp.endsWith('?');
    tmp = tmp.substring(0, o ? tmp.length - 1 : tmp.length)
		if (c === '*') {
			keys.push(tmp.substr(1) || '_');
      tmp = '(/.*?)';
      wilds++
		} else if (c === ':') {
			keys.push(tmp.substring(1));
      tmp = '/([^/]+?)';
      params++
		} else {
      tmp = '/' + tmp;
      statics++
		}
    pattern += o ? `(?:${tmp})?` : tmp
  }

  return {
    meta,
    keys,
    wilds,
    statics,
    params,
    regex: new RegExp('^' + pattern + '\/?$', 'i'),
  }
}

export interface Params {
  [key: string]: string
}

function exec(path: string, part: ParsedPart) {
  let i=0, out: Params = {};
  let matches = part.regex.exec(path);
  while (i < part.keys.length) {
    out[ part.keys[i] ] = matches[++i] || null;
  }
  return out;
}

export default function createRecognizer<Handler>(
  base: string = ''
) {
  base = strip(base)
  let sorted = true
  const routes: ParsedPart<Handler[]>[] = []

  function add(path: string, ...handlers: Handler[]) {
    if (!handlers.length) return () => {}
    const obj = parse(`${base}/${strip(path)}`, [...handlers])
    routes.push(obj)
    sorted = false
    return () => {
      const i = routes.findIndex((o) => o === obj)
      if (!~-1) return
      routes.splice(i,1)
    }
  }

  function sort() {
    if (sorted) return
    routes.sort((
      {wilds, params, statics},
      {wilds: wildsB, params: paramsB, statics: staticsB }
    ) => {
      if (wilds - wildsB) return wilds - wildsB
      if (!params && paramsB) return -1
      if (params && !paramsB) return 1
      return staticsB - statics || paramsB - params
    })
    sorted = true
  }

  function match_local(path: string) {
    sort()
    const res = match(path, routes)
    return res && {
      handlers: res.meta,
      params: exec(path, res)
    }
  }

  function controlled(path: string) {
    return strip(path).startsWith(base)
  }

  return {
    add,
    sort,
    controlled,
    match: match_local,
  }
}
