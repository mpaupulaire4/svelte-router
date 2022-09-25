import { onMount, setContext, type ComponentType, getContext } from 'svelte';
import navaid from './navaid';
import { flattenRoutes, type FlatRoute, type Route } from './utils';
export { default as Route } from './Route.svelte';

type RouteData = [ComponentType, unknown][];

export function useRoutes(routes: Array<Route>, base = '', listen = true) {
  const handlers = flattenRoutes(routes);
  handlers.forEach(r => r.handlers.reverse());
  return useHandlers(handlers, base, listen);
}

export function useHandlers(handlers: FlatRoute[], base = '', listen = true) {
  const {
    listen: listenFN,
    on,
    route,
    subscribe,
    preload,
    run,
  } = navaid<RouteData>(base);
  setContext('svelte-router-internal-handlers', { subscribe });
  handlers.forEach(r => {
    on(r.path, (params, ctx) => {
      return r.handlers.map<[ComponentType, unknown]>(([c, h]) => [
        c,
        h && h(params, ctx),
      ]);
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

  setContext('svelte-router', context);
  return context;
}

export function useRouter() {
  return getContext<ReturnType<typeof useHandlers>>('svelte-router');
}
