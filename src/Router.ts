import type { Params } from './Recognizer'
import createRecognizer, { strip } from './Recognizer'

export interface Route {
  path: string
  routes?: Route[]
}

interface FlattenPesult {
  path: string,
  handlers: any[]
}


function flatten(
  {path, routes, ...config}: Route,
  parent: FlattenPesult = { path: '', handlers: [] }
): FlattenPesult[] {
  const handlers = parent.handlers.concat(config)
  path = `${strip(parent.path)}/${strip(path)}`
  if (routes && routes.length) {
    return routes.reduce((agg, route) => {
      return agg.concat(flatten(route, { handlers, path }))
    }, [] as FlattenPesult[])
  }
  return [{
    path,
    handlers
  }]
}

type Callback<T> = (params: Params, ...args: any[]) => T

export interface Handler {
  data?: Callback<any>
  component: any
}

export interface ActiveHandler extends Omit<Handler, 'data'> {
  data: any
}

export function createRouter(base: string = '', routes: Route[] = []) {
  const { match, sort, add, controlled } = createRecognizer<() => Promise<Handler> | Handler>(base)

  routes.forEach((route) =>
    flatten(route)
      .forEach(({path, handlers}) => add(path, ...handlers)))

  function change(path: string, ...args: any[]): Promise<ActiveHandler[] | null | undefined> {
    const matched = match(path)
    if (matched) {
      return Promise.all(matched.handlers.map(async (handler) => {
        const { data = () => {}, ...rest } = await handler()
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
