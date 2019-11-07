<svelte:options tag="svelte-router"/>
<script context="module">
  import { readable, writable, get } from 'svelte/store';
  import { parse } from './utils';

  export const query = writable('');
  export const route = writable('');
  export const preloading = writable(false);

  const preloads = new Map()
  let _initial_data = {}

  export function register({ key, path, prefetch, exact } = {}) {
    if (preloads.has(key)) {
      return preloads.get(key);
    }
    const match = parse(path, !exact)
    if (!prefetch) {
      return {
        data: readable({}),
        match
      }
    }
    const config = {
      match,
      prefetch,
      data: writable(_initial_data[key] || {})
    };
    delete _initial_data[key]
    preloads.set(key, config);
    return { match, data: config.data };
  }

  export function unregister(key) {
    if (key) {
      preloads.delete(key)
    } else {
      preloads.clear()
    }
  }

  function hydrate({route, search, data}) {
    Object.keys(data).forEach((key) => {
      if (preloads.has(key)) {
        preloads.get(key).data.set(data[key])
      }
    })
    route.set(state.route)
    query.set(state.search)
  }
</script>
<script>
  import { setContext, onMount } from 'svelte';
  import { find_anchor, which, debounce } from './utils'

  export let base = ''
  export let location = window.location
  export let history = window.history
  export let data = {}
  _initial_data = data

  export function isNavigable(url) {
    if (url.origin !== location.origin) return false;
    if (!url.pathname.startsWith(base)) return false;
    if (url.pathname === location.pathname && url.search === location.search) return false;
    return true;
  }

  let page_data = Object.create(null);
  function preload(pathname, query = '') {
    if (page_data[pathname]) return page_data[pathname];
    const promises = []
    for (let [key, config] of preloads.entries()) {
      const params = config.match(pathname);
      if (params) {
        let data = config.prefetch({ params, query });
        if (data instanceof Promise) {
          promises.push(data.then((d) => () => {
            config.data.set(d)
            return { key, data: d }
          }));
        } else {
          promises.push(() => {
            config.data.set(data)
            return { key, data }
          });
        }
      }
    }
    return page_data[pathname] = promises
  }

  route.set(location.pathname)
  query.set(location.search)


  async function navigate(url, push = true) {
    const data_hydrate = {};
    let promises = [];
    if (page_data[url.pathname]) {
      promises = page_data[url.pathname]
    } else {
      promises = preload(url.pathname, url.query)
    }
    if (promises.length) {
      preloading.set(true);
      const cbs = await Promise.all(page_data[url.pathname])
      cbs.forEach((cb) => {
        const {key, data} = cb()
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

  onMount(() => {
    isNavigable(location) && navigate(location, false)
  })

  setContext('svelte-router-internals-base', base)
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