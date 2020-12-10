<script context="module" lang="ts">
  import type { ActiveHandler } from './Router'

  export type Await<T> = T extends Promise<infer U> ? U : T
  export type Handlers = ActiveHandler<any>[];

  export interface Adapter {
    push: (url: URL, state: object) => void
    replace: (url: URL, state: object) => void
    onChangeURL?: (listener: (url: URL, state: object) => void) => () => void
    location: URL
  }

  function qsParse(_:string, url: URL) {
    const qs = {} as {[key: string]: any }
    url.searchParams.forEach((value, key) => {
      if (!qs[key]) {
        qs[key] = value
      } else if (Array.isArray(qs[key])) {
        qs[key].push(value)
      } else {
        qs[key] = [qs[key], value]
      }
    })
    return qs
  }

  const defaultAdapter: Adapter = {
    push: (url: URL, ctx: object) => history.pushState({ctx, href: url.href}, '', url.href),
    replace: (url: URL, ctx: object) => history.replaceState({ctx, href: url.href}, '', url.href),
    get location() {
      return new URL(window.location.href)
    }
  }

</script>

<script lang="ts">
  import { createRouter } from './Router';
  import { onMount, setContext } from 'svelte';
  import { writable } from 'svelte/store';
  import { strip } from './Recognizer';
  import ChildRoute from './ChildRoute.svelte';

  export let base = '';
  export let routes: Route[];
  export let queryParser: typeof qsParse = qsParse;
  export let historyAdapter: Adapter = defaultAdapter;

  routes.map((route) => {

  })

  onMount(() => {
    navigate(historyAdapter.location, {}, true)
    if (historyAdapter.onChangeURL) {
      return historyAdapter.onChangeURL((url, state) => {
        change(url, state)
      })
    }
  })

  const striped_base = strip(base)

  const router = createRouter<string>(base)
  const handlers = writable<Handlers>([])
  const loading = writable<boolean>(false)
  const preloads = new Map<string, Promise<Handlers>>()

  setContext('svelte-router-internal-handlers', handlers)
  setContext('svelte-router-internal-index', 0)
  setContext('svelte-router-internal-mapping', [])
  setContext('svelte-router-internal-path', '')
  setContext('svelte-router-internal-add', router.add)

  function load(url: URL, ctx: object = {}) {
    if (preloads.has(url.href)) {
      return preloads.get(url.href)
    }
    return router.change(url.pathname, queryParser(url.search, url), {})
  }

  async function change(url: URL, ctx: object = {}) {
    try {
      $loading = true
      $handlers = (await load(url, ctx)) || []
      preloads.clear()
      return ctx
    } catch (_) {
      $handlers = []
      return null
    } finally {
      $loading = false
    }
  }

  export function preload(url: string | URL, ctx: object = {}) {
    if (typeof url === 'string') {
      url = new URL(url, historyAdapter.location.host)
    }
    preloads.set(url.href, load(url, ctx))
  }

  export async function navigate(url: string | URL, ctx: object = {}, replace: boolean=false) {
    if (typeof url === 'string') {
      url = new URL(url, historyAdapter.location.host)
    }
    const state = await change(url, ctx)
    if (state) {
      historyAdapter[replace ? 'replace' : 'push'](url, state)
    }
  }

  setContext('svelte-router', {
    preload,
    navigate,
    loading: {
      subscribe: loading.subscribe
    }
  })

  function click(e: any) {
    let x = e.target.closest('a'), y = x && new URL(x.href);
    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || e.button || e.defaultPrevented) return;
    if (!y || x.target || y.host !== historyAdapter.location.host) return;
    y.pathname = strip(y.pathname.replace('$base', striped_base))
    e.preventDefault();
    navigate(y, {}, y.href === historyAdapter.location.href);
  }

  function popstate(e: any) {
    change(new URL(e.state.href), e.state.ctx)
  }
</script>

<svelte:window
  on:click="{click}"
  on:popstate="{popstate}"
/>

<ChildRoute />
