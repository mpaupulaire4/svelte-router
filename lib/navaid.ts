import { parse as convert, type RouteParams } from 'regexparam';
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

type CacheItem<T> = {
  data: T;
  ctx: Context;
};

export default function Navaid<T>(base = '') {
  const routes: RouteMatcher<T>[] = [];
  const { set, subscribe } = writable<T | undefined>();
  const cache = new Map<string, CacheItem<T>>();

  base = cleanPath(base);
  const rgx = base == '/' ? /^\/+/ : new RegExp('^\\' + base + '(?=\\/|$)\\/?', 'i');

  function fmt(uri: string) {
    if (!uri) return uri;
    uri = cleanPath(uri);
    return rgx.test(uri) ? uri.replace(rgx, '/') : '';
  }

  function route(uri: string, replace = false) {
    if (uri[0] == '/' && !rgx.test(uri)) uri = base + uri;
    history[replace ? 'replaceState' : 'pushState'](run(uri), '', uri);
  }

  function on<S extends string>(
    pat: S,
    fn: (params: RouteParams<S>, ctx: Context, uri: string) => T
  ) {
    routes.push({
      ...convert(pat),
      fn,
    });
  }

  function get(uri: string, ctx: Context = {}): T | undefined {
    const params: Context = {};
    let arr: RegExpExecArray | null, obj: RouteMatcher<T>;
    for (let i = 0; i < routes.length; i++) {
      if ((arr = (obj = routes[i]).pattern.exec(uri))) {
        for (i = 0; i < obj.keys.length; ) {
          params[obj.keys[i]] = arr[++i] || null;
        }
        return obj.fn(params, ctx, uri);
      }
    }
  }

  function preload(uri: string): string {
    uri = fmt(uri);
    if (uri && !cache.has(uri)) {
      const ctx: Context = {};
      const data = get(uri, ctx);
      if (data) {
        cache.set(uri, {
          data,
          ctx,
        });
      }
    }
    return uri;
  }

  function run(uri: string): Context | undefined {
    uri = preload(uri);
    const { data, ctx } = cache.get(uri) || {};
    set(data);
    cache.clear();
    return ctx;
  }

  function listen() {
    function handle(e: PopStateEvent) {
      set(get(location.pathname, e.state as Context));
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

    set(get(location.pathname, history.state as Context));
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
    on,
  };
}
