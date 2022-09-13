import type { ComponentType } from 'svelte';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DataFN = (params: any, ctx: any) => any;

export interface Route {
  path: string;
  dataFN?: DataFN;
  component?: ComponentType;
  routes?: Route[];
}

export interface FlatRoute {
  path: string;
  handlers: [ComponentType, DataFN | void][];
}

export function flattenRoutes(routes: Route[], base = ''): FlatRoute[] {
  return routes.flatMap(({ path, component, routes, dataFN }) => {
    path = `${base}${cleanPath(path)}`;
    const handlers: FlatRoute[] = routes ? flattenRoutes(routes, path) : [];
    if (component) {
      if (!handlers.length) {
        handlers.push({
          path,
          handlers: [],
        });
      }
      handlers.forEach(h => {
        h.handlers.push([component, dataFN]);
      });
    }
    return handlers;
  });
}

export function getAnchorHREF(e: MouseEvent): string | undefined {
  const x = (e.target as Element).closest('a'),
    y = x && x.getAttribute('href');
  if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || e.button || e.defaultPrevented)
    return;
  if (!y || x.target || x.host !== location.host || y[0] == '#') return;
  return y;
}

export function cleanPath(path: string) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  path = path.match(/^[^?#]*/)![0];
  return `/${path.replace(/^\/|\/$/g, '')}`;
}
