<svelte:options tag="svelte-router"/>
<script context="module">
  import { readable, writable, get } from 'svelte/store';
  import URLPattern from 'url-pattern'

  const preloads = new Map()

  export const query = writable({});
  export const route = writable('');
  export const preloading = writable(false);
  export let _initial_data = {}

  export function register(key, { path, prefetch } = {}) {
    key = key || path
    if (preloads.has(key)) {
      return preloads.get(key);
    }
    const pattern = new URLPattern(path);
    if (!prefetch) {
      return {
        data: readable({}),
        pattern
      }
    }
    const config = {
      pattern,
      prefetch,
      preloads: {},
      data: writable(_initial_data[key] || {})
    };
    preloads.set(key, config);
    return { pattern, data: config.data };
  }

  export function unregister(key) {
    preloads.delete(pattern)
  }

  function preload(pathname, query = {}) {
    for (let [key, config] of preloads.entries()) {
      const params = config.pattern.match(pathname);
      if (params && !config.preloads[pathname]) {
        config.preloads[pathname] = config.prefetch({ params, query });
      }
    }
  }

  function hydrate({route, search, data}) {
    Object.keys(data).forEach((key) => {
      if (preloads.has(key)) {
        preloads.get(key).data.set(data[key])
      }
    })
    route.set(state.route)
    query.set(qsparse(state.search))
  }
</script>
<script>
  import { setContext, onMount } from 'svelte';
  import { qsparse, find_anchor, which, debounce } from './utils'

  export let base = ''
  export let location = window.location
  export let history = window.history
  export let data = {}
  const basePath = base.trim() ? base.trim().replace(/^\/?(.+)\/?$/, '/$1') : ''

  _initial_data = data
  route.set(location.pathname)
  query.set(qsparse(location.search))

  function isNavigable(url) {
    if (url.origin !== location.origin) return false;
    if (!url.pathname.startsWith(basePath)) return false;
    if (url.pathname === location.pathname && url.search === location.search) return false;
    return true;
  }

  async function navigate(url, push = true, _initial_data = {}) {
    const promises = [];
    const data_hydrate = {};
    for (let [key, config] of preloads.entries()) {
      const params = config.pattern.match(url.pathname);
      if (params) {
        let data = _initial_data[key] || config.preloads[url.pathname]
        if (!data) {
          data = config.prefetch({ params, query: qsparse(url.search) })
        }
        if (data instanceof Promise) {
          promises.push(data.then((res) => {
            data_hydrate[key] = res;
            config.data.set(res);
          }))
        } else {
          data_hydrate[key] = data;
          config.data.set(data)
        }
      }
      config.preloads = {};
    }
    if (promises.length) {
      preloading.set(true);
      await Promise.all(promises);
      preloading.set(false);
    }
    const state = { route: url.pathname, search: url.search, data: data_hydrate };
    if (push) {
      history.pushState(state, '', url.href);
    } else {
      history.replaceState(state, '', url.href);
    }
    route.set(url.pathname);
    query.set(qsparse(url.search));
  }

  onMount(() => {
    navigate(location, false, data)
    _initial_data = {}
  })

  setContext('svelte-router-internals', {
    segment: '',
    base: basePath
  })

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
    preload(url.pathname, qsparse(url.search));
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