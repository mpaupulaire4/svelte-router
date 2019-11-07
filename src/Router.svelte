<svelte:options tag="svelte-router"/>
<script context="module">
  import { readable, writable } from 'svelte/store';
  import { parse } from './utils';

  export const query = writable('');
  export const route = writable('');
  export const preloading = writable(false);

  const empty_data = readable(true)
</script>
<script>
  import { setContext, onMount } from 'svelte';
  import { find_anchor, which, debounce, Router } from './utils'

  export let base = ''
  export let location = window.location
  export let history = window.history
  export let data = null

  const preloads = new Router()
  const stores = new Map()

  function register_route(route, { key, prefetch, middleware } = {}) {
    if (stores.has(key)) return stores.get(key);
    if (!prefetch) {
      return empty_data
    }
    const store = writable((data && data[key]) || false)
    stores.set(key, store)
    preloads.add(route, (params) => ({ key, prefetch, store, params }), middleware)
    return store
  }

  function isNavigable(url) {
    if (url.origin !== location.origin) return false;
    if (!url.pathname.startsWith(base)) return false;
    if (url.pathname === location.pathname && url.search === location.search) return false;
    return true;
  }

  function hydrate({route, search, data}) {
    preloads.find(route).forEach(({ key, store }) => {
      store.set(data[key])
    })
    route.set(state.route)
    query.set(state.search)
  }

  const route_data = new Map();
  function preload(pathname, query = '') {
    if (route_data.has(pathname)) return route_data.get(pathname);
    const promises = preloads.find(pathname)
    .map(async ({ key, prefetch, params, store }) => {
      const data = await prefetch({params, path: pathname, query});
      return {
        key,
        data,
        set: () => store.set(data)
      }
    })
    route_data.set(pathname, promises)
    return promises
  }


  async function navigate(url, push = true) {
    const data_hydrate = {};
    let promises = [];
    if (route_data.has(url.pathname)) {
      promises = route_data.get(url.pathname)
    } else {
      promises = preload(url.pathname, url.query)
    }
    route_data.clear();
    if (promises.length) {
      preloading.set(true);
      const cbs = await Promise.all(promises)
      cbs.forEach(({key, data, set}) => {
        data_hydrate[key] = data
        set();
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

  onMount(() => {
    if (!isNavigable(location)) return
    if (data) {
      const state = {
        route: location.pathname,
        query: location.query,
        data
      };
      history.replaceState(state, '', url.href);
    } else {
      navigate(location, false)
    }
  })

  setContext('svelte-router-internals-consts', { base, register_route })
  setContext('svelte-router-internals-parent', '')

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