import { writable } from '@crikey/stores-strict';
import { getAnchorHREF, cleanPath } from './utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Context = Record<string | number, any>;
export type RouteMatcher<T> = {
  keys: string[];
  pattern: RegExp;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: (params: any, ctx: any, uri: string) => T;
};

export type RouteData<T> = [string, Context, T | null];

export default function Router<T>(base = '') {
  const routes: RouteMatcher<T>[] = [];
  const { set, subscribe } = writable<RouteData<T>>(['', {}, null]);
  const cache = new Map<string, RouteData<T>>();

  base = cleanPath(base);
  const rgx =
    base == '/'
      ? /^\/+/
      : new RegExp('^' + base.split('/').join('\\/') + '(?=\\/|$)\\/?', 'i');

  function fmt(uri: string) {
    if (!uri) return uri;
    uri = cleanPath(uri);
    return rgx.test(uri) ? uri.replace(rgx, '/') : uri;
  }

  function route(uri: string, replace = false) {
    if (uri[0] == '/' && !rgx.test(uri)) uri = base + uri;
    history[replace ? 'replaceState' : 'pushState'](run(uri), '', uri);
  }

  function add<K extends string>(
    pattern: RegExp,
    keys: Array<K>,
    fn: (params: Record<K, string>, ctx: Context, uri: string) => T
  ) {
    routes.push({
      pattern,
      keys,
      fn,
    });
  }

  function get(uri: string, ctx: Context = {}): RouteData<T> | undefined {
    const params: Context = {};
    let arr: RegExpExecArray | null, obj: RouteMatcher<T>;
    for (let i = 0; i < routes.length; i++) {
      if ((arr = (obj = routes[i]).pattern.exec(uri))) {
        for (i = 0; i < obj.keys.length; ) {
          params[obj.keys[i]] = arr[++i] || null;
        }
        return [uri, ctx, obj.fn(params, ctx, uri)];
      }
    }
    return;
  }

  function preload(uri: string): string {
    uri = fmt(uri);
    if (!cache.has(uri)) {
      const ctx: Context = {};
      const data = get(uri, ctx);
      if (data) {
        cache.set(uri, data);
      }
    }
    return uri;
  }

  function run(uri: string): Context | undefined {
    uri = preload(uri);
    const data = cache.get(uri) || [uri, {}, null];
    set(data);
    cache.clear();
    return data[1];
  }

  function listen() {
    function change(uri: string, ctx: Context = {}) {
      uri = fmt(uri);
      const data = uri && get(uri, ctx);
      set(data || [uri, {}, null]);
    }

    function handle(e: PopStateEvent) {
      change(location.pathname, e.state as Context);
    }

    function click(e: MouseEvent) {
      const y = getAnchorHREF(e);
      if (!y) return;
      if (y[0] != '/' || rgx.test(y)) {
        e.preventDefault();
        route(y, y === location.pathname);
      }
    }

    function hover(e: MouseEvent) {
      const y = getAnchorHREF(e);
      if (!y) return;
      if (y[0] != '/' || rgx.test(y)) {
        e.preventDefault();
        preload(y);
      }
    }

    addEventListener('popstate', handle);
    addEventListener('click', click);
    addEventListener('mouseenter', hover);

    change(location.pathname, history.state as Context);
    return () => {
      removeEventListener('popstate', handle);
      removeEventListener('click', click);
      removeEventListener('mouseenter', hover);
    };
  }

  return {
    route,
    run,
    preload,
    subscribe,
    listen,
    add,
  };
}
