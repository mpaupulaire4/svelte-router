import type { Params } from './Recognizer'
import createRecognizer from './Recognizer'

type Callback<T> = (params: Params, ...args: any[]) => T

export interface Handler<T> {
  data?: Callback<Promise<any>>
  component: T
}

export interface ActiveHandler<T> extends Omit<Handler<T>, 'data'> {
  data: any
}

export function createRouter<T>(base: string = '') {
  const recognizer = createRecognizer<() => Promise<Handler<T>> | Handler<T>>(base)

  function change(path: string, ...args: any[]): Promise<ActiveHandler<T>[] | null> {
    const matched = recognizer.match(path)
    if (matched) {
      return Promise.all(matched.handlers.map(async (handler) => {
        const { data = () => {}, ...rest } = await handler()
        return {
          ...rest,
          component: rest.component,
          data: (await data(matched.params, ...args)) || {}
        }
      }))
    } else {
      return null
    }
  }

  return {
    add: recognizer.add,
    map: recognizer.map,
    change,
  }
}
