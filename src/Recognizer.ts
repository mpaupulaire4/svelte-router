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
  base: string = '',
) {
  base = strip(base) + '/'
  let sorted = true
  const routes: ParsedPart<Handler[]>[] = []

  function add(path: string, ...handlers: Handler[]) {
    if (!handlers.length) return
    const obj = parse(base + strip(path), [...handlers])
    routes.push(obj)
    sorted = false
    return this
  }

  function match_local(path: string) {
    if (!sorted) {
      // TODO revisit sorting
      routes.sort(({wilds, params}, {wilds: wildsB, params: paramsB }) => {
        if (wilds && !wildsB) {
          return 1
        } else if (!wilds && wildsB) {
          return -1
        }
        if (!wilds) {
          return params - paramsB
        }
        return wildsB - wilds || paramsB - params
      })
      sorted = true
    }
    const res = match(path, routes)
    return res && {
      handlers: res.meta,
      params: exec(path, res)
    }
  }

  type Submapper = (mapper: typeof map) => void
  function map(path: string, handlers: Handler[], submapper?: Submapper): void
  function map(path: string, submapper: Submapper): void
  function map(path: string, handlers: Handler[] | Submapper = [], submapper?: Submapper) {
    if (typeof handlers === 'function') {
      submapper = handlers
      handlers = [] as Handler[]
    }
    if (submapper) {
      submapper((subpath: string, subhandlers: Handler[] | Submapper = [], submapper?: Submapper) => {
        if (typeof subhandlers === 'function') {
          submapper = subhandlers
          subhandlers = [] as Handler[]
        }
        return map(`${strip(path)}/${strip(subpath)}`, [...handlers as Handler[], ...subhandlers], submapper)
      })
    } else if (handlers.length) {
      add(path, ...handlers)
    }
    return this
  }


  return {
    add,
    match: match_local,
    map
  }
}
