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

type Callback<T> = (params: Params, ...args: any[]) => T

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

export function createRouter({ base = '', routes = []}: RouterConfig = {}) {
  const { match, sort, add, controlled } = createRecognizer<(() => Promise<Handler>) | Handler>(base)

  routes.forEach((route) =>
    flattenRoute(route)
      .forEach(({path, handlers}) => add(path, ...handlers)))

  function change(path: string, ...args: any[]): Promise<ActiveHandler[] | null | undefined> {
    const matched = match(path)
    if (matched) {
      return Promise.all(matched.handlers.map(async (handler) => {
        const { data = () => {}, ...rest } = typeof handler === 'function' ?
          await handler() :
          handler
        return {
          ...rest,
          data: (await data(matched.params, ...args)) || {}
        }
      }))
    } else {
      return controlled(path) ? null : undefined
    }
  }

  return {
    add,
    sort,
    change,
  }
}
