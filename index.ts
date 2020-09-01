interface ParsedPart<T = any> {
  keys: string[]
  pattern: string
  full: RegExp
  partial: RegExp
  params: number
  wilds: number
  meta?: T
}

const SEP = '/';

function strip(str: string) {
	(str[0] === SEP) && (str=str.substring(1));
	let len = str.length - 1;
	return str[len] === SEP ? str.substring(0, len) : str;
}

export function match<T>(path: string, parts: ParsedPart<T>[]) {
	for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
		if (part.full.test(path)) {
      const params = exec(path, part)
      return {
        ...part,
        params
      }
		}
	}
	return null;
}


export function parse<T>(str: string, meta?: T): ParsedPart<T> {
  const arr = strip(str).split(SEP)
  const keys: string[] = []
  let tmp: string
  let pattern: string = ''
  let wilds = 0
  let params = 0
	while (tmp = arr.shift()) {
		let c = tmp[0];
    let o = tmp.endsWith('?');
    tmp = tmp.substring(0, o ? tmp.length - 1 : tmp.length)
		if (c === '*') {
			keys.push(tmp.substr(1) || '_');
      tmp = '/(.*?)';
      wilds++
		} else if (c === ':') {
			keys.push(tmp.substring(1));
      tmp = '/([^/]+?)';
      params++
		} else {
      tmp = '/' + tmp;
		}
    pattern += o ? `(?:${tmp})?` : tmp
  }

  return {
    meta,
    keys,
    pattern,
    wilds,
    params,
    full: new RegExp('^' + pattern + '\/?$', 'i'),
    partial: new RegExp('^' + pattern + '(?=$|\/)', 'i')
  }
}

interface Params {
  [key: string]: string
}

export function exec(path: string, part: ParsedPart) {
  let i=0, out: Params = {};
  let matches = part.full.exec(path);
  while (i < part.keys.length) {
    out[ part.keys[i] ] = matches[++i] || null;
  }
  return out;
}


export default function createRecognizer<Handler>(
  base: string
) {
  base = strip(base) + '/'
  const routes: ParsedPart<Handler[]>[] = []

  function add(path: string, handler: Handler) {
    const obj = parse(base + strip(path), [handler])
    routes.push(obj)
    const remove = () => {
      const i = routes.findIndex((o) => o === obj)
      if (!!~i) {
        routes.splice(i,1)
      }
    }
    return {
      sub: (match: typeof add) => {

      }
    }
  }


  return {
    add
  }
}

const paths = ['/', 'posts', '/posts/:id', '*/other'].map((path) => parse(path))
console.log(match('/asdfasdfasd/asdfasdfas/asdfasdfa/other', paths).params)
console.log(match('/posts/1', paths).params)
console.log(match('/asdfasdfasd/asdfasdfas/asdfasdfa/', paths))
