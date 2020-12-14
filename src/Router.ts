import type { Params } from './Recognizer'
import { strip, createRecognizer } from './Recognizer'

interface Route<T> {
  path: string
  routes?: Route<T>[]
  handler?: T | (() => Promise<T>)
}

interface FlattenPesult {
  path: string,
  handlers: any[]
}

export function flattenRoute<T>(
  {path, routes, handler}: Route<T>,
  parent: FlattenPesult = { path: '', handlers: [] }
): FlattenPesult[] {
  const handlers = handler ? parent.handlers.concat(handler) : parent.handlers
  path = `${strip(parent.path)}/${strip(path)}`
  if (routes && routes.length) {
    return routes.reduce((agg, route) => {
      return agg.concat(flattenRoute(route, { handlers, path }))
    }, [] as FlattenPesult[])
  }
  return [{
    path,
    handlers
  }]
}

interface RouteInfo {
  params: Params,
  path: string,
  query: string,
}

type Callback<T> = (params: RouteInfo, ...args: any[]) => T

export interface Handler {
  data?: Callback<any>,
  [key: string]: any
}

export interface ActiveHandler extends Omit<Handler, 'data'> {
  data: any
}

export interface RouterConfig {
  base?: string
  routes?: Route<Handler>[]
}

function toActiveHandler(
  { data = () => {}, ...rest }: Handler,
  routeInfo: RouteInfo,
  ...args: any[]
): ActiveHandler {
  return {
    ...rest,
    data: data(
      routeInfo,
      ...args
    )
  }
}

// TODO: explicitly create a context object to be passed in
// This will fix the issue where the context on preloads isn't ever saved
// This will also allow the handling of redirects during a route change
export function createRouter({ base = '', routes = []}: RouterConfig = {}) {
  const { match, sort, add, controlled } = createRecognizer<Route<Handler>['handler']>(base)
  const preloads = new Map<string, Array<ActiveHandler | Promise<ActiveHandler>>>()

  routes.forEach((route) =>
    flattenRoute(route)
      .forEach(({path, handlers}) => add(path, ...handlers)))

  function get(path: URL, ...args: any[]): Array<ActiveHandler | Promise<ActiveHandler>> | null {
    const matched = match(path.pathname)
    if (matched) {
      const routeInfo = {
        params: matched.params,
        path: path.pathname,
        query: path.search,
      }
      return matched.handlers.map((handler) => {
        if (typeof handler === 'function') {
          return handler().then((handler) => toActiveHandler(handler, routeInfo, ...args))
        }
        return toActiveHandler(handler, routeInfo, ...args);
      })
    } else {
      return null
    }
  }

  function load(...args: Parameters<typeof get>) {
    return preloads.has(args[0].href) ?
      preloads.get(args[0].href) :
      get(...args)
  }

  return {
    add,
    sort,
    controlled,
    preload: (...args: Parameters<typeof get>) =>
      preloads.set(args[0].href, load(...args)),
    get: (...args: Parameters<typeof get>) => {
      const result = load(...args)
      preloads.clear()
      return result
    },
    clearPreloads: () => preloads.clear(),
  }
}
