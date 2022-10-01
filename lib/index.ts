import { onMount, setContext, type ComponentType, getContext } from 'svelte';
import router from './router';
import {
  type FlatRoute,
  type Route,
  type ResolvedHandlers,
  flattenRoutes,
  setInternal,
} from './utils';
export { default as Route } from './Route.svelte';
import { parse as convert } from 'regexparam';

const contextKey = 'svelte-router';

export function useHandlers(handlers: FlatRoute[], base = '', listen = true) {
  const {
    listen: listenFN,
    add,
    route,
    subscribe,
    preload,
    run,
  } = router<ResolvedHandlers>(base);
  setInternal({ subscribe });
  handlers.forEach(({ pattern, path, keys, handlers }) => {
    let p: { pattern: RegExp; keys: string[] };
    if (pattern) {
      p = {
        pattern,
        keys: keys || [],
      };
    } else {
      p = convert(path || '/');
    }
    add(p.pattern, p.keys, (params, ctx) => {
      return handlers.map<[ComponentType, unknown]>(([c, h]) => [c, h && h(params, ctx)]);
    });
  });

  if (listen) {
    onMount(listenFN);
  }

  const context = {
    route,
    run,
    preload,
  };

  setContext(contextKey, context);
  return context;
}

export function useRoutes(routes: Array<Route>, base = '', listen = true) {
  const handlers = flattenRoutes(routes);
  handlers.forEach(r => r.handlers.reverse());
  return useHandlers(handlers, base, listen);
}

export function useRouter() {
  return getContext<ReturnType<typeof useHandlers>>(contextKey);
}
