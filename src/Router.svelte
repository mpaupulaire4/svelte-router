<svelte:options tag="svelte-router"/>
<script context="module">
  import { readable, writable, derived } from 'svelte/store';
  import { parse, Router } from './utils';

  const data_store = new Map();
  const stores = new Map();
  const preload_router = new Router();
  const empty_store = readable({});

  export const query = writable(null);
  export const route = writable(null);
  export const preloading = writable(false);

  export function register_route(full_path) {
    const match = parse(full_path);
    return readable(null, (set) => {
      return route.subscribe((val) => set(match(val)));
    })
  }

  export function register_preload(path, fetch, {key, initial, middleware = false} = {}) {
    if (!fetch) return empty_store
    if (key && stores.has(key)) return stores.get(key)
    const store = readable(initial, (set) => {
      return preload_router.add(middleware, path, { set, fetch, key })
    })
    if (key) stores.set(key, store)
    return store
  }

  function preload(pathname, query = '') {
    const key = `${pathname}${query}`;
    if (data_store.has(key)) return data_store.get(key);
    const handlers = preload_router.find(pathname).map(async ({ params, handler: { set, fetch, key } }) => {
      const data = await fetch({ params, path: pathname, query });
      return () => {
        set(data)
        return { key, data }
      };
    });
    data_store.set(key, handlers);
    return handlers
  }

  async function navigate(url, push = true) {
    const data_hydrate = {};
    const promises = preload(url.pathname, url.query);
    data_store.clear();
    if (promises.length) {
      preloading.set(true);
      const cbs = await Promise.all(promises)
      cbs.forEach((cb) => {
        const { key, data } = cb()
        data_hydrate[key] = data
      })
      preloading.set(false);
    }
    route.set(url.pathname);
    query.set(url.search);
    const state = { route: url.pathname, search: url.search, data: data_hydrate };
    if (push) {
      history.pushState(state, '', url.href);
    } else {
      history.replaceState(state, '', url.href);
    }
  }

  function hydrate(state) {
    route.set(state.route)
    query.set(state.search)
    preload_router
      .find(route)
      .forEach(({ handler: { set, key } }) => set(state.data[key]));
  }

</script>
<script>
  import { setContext, onMount } from 'svelte';
  import { find_anchor, which, debounce } from './utils'

  export let base = ''
  export let location = window.location
  export let history = window.history

  const stores = new Map()

  function isNavigable(url) {
    if (url.origin !== location.origin) return false;
    if (!url.pathname.startsWith(base)) return false;
    if (url.pathname === location.pathname && url.search === location.search) return false;
    return true;
  }

  setContext('svelte-router-internals-parent', base)
  setContext('svelte-router-internals-parse', parse)

  setContext('svelte-router', {
    query,
    route,
    preloading,
    preload,
    goto: (href, push = true) => {
      const url = new URL(href, location.origin)
      if (!isNavigable(url)) return;
      return navigate(url, push)
    },
    go: history.go,
    back: history.back,
    forward: history.forward,
  })

  if (location.pathname.startsWith(base)) navigate(location, false);

  function handle_click(event) {
    // Adapted from https://github.com/visionmedia/page.js
    // MIT license https://github.com/visionmedia/page.js#license
    if (which(event) !== 1) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey) return;
    if (event.defaultPrevented) return;

    const a = find_anchor(event.target);
    if (!a) return;
    if (!a.href) return;

    // check if link is inside an svg
    // in this case, both href and target are always inside an object
    const svg = typeof a.href === 'object' && a.href.constructor.name === 'SVGAnimatedString';
    const href = String(svg ? (a).href.baseVal : a.href);

    if (href === location.href) {
      if (!location.hash) event.preventDefault();
      return;
    }

    // Ignore if tag has
    // 1. 'download' attribute
    // 2. rel='external' attribute
    if (a.hasAttribute('download') || a.getAttribute('rel') === 'external') return;

    // Ignore if <a> has a target
    if (svg ? (a).target.baseVal : a.target) return;

    const url = new URL(href);

    // Don't handle hash changes, origin changes, or
    // routes outside specified root
    if (!isNavigable(url)) return;
    event.preventDefault();
    navigate(url)
  }

  function handle_prefetch(event) {
    const a = find_anchor(event.target);
    if (!a || !a.href || a.rel !== 'prefetch' || a.hasAttribute('download')) return;

    const svg = typeof a.href === 'object' && a.href.constructor.name === 'SVGAnimatedString';
    const href = String(svg ? (a).href.baseVal : a.href);

    if (href === location.href) {
      if (!location.hash) event.preventDefault();
      return;
    }

    const url = new URL(href);

    // Don't handle hash changes, origin changes, or
    // routes outside specified root
    if (!isNavigable(url)) return;
    preload(url.pathname, url.search);
  }

  function popstate({state}) {
    hydrate(state)
  }
</script>

<svelte:window
  on:click="{handle_click}"
  on:mousemove="{debounce(handle_prefetch)}"
  on:popstate="{popstate}"
/>

<slot></slot>