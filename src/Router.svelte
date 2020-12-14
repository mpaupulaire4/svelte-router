<script context="module" lang="ts">
  import type { ActiveHandler } from './Router'

  export type Handlers = Array<ActiveHandler | Promise<ActiveHandler>>;
</script>

<script lang="ts">
  import type { createRouter } from './Router';
  import type { Location } from './Location';
  import { setContext } from 'svelte';
  import { derived } from 'svelte/store';
  import ChildRoute from './ChildRoute.svelte';
  import { createHistoryLocation } from './Location';

  export let router: ReturnType<typeof createRouter>;
  export let location: Location = createHistoryLocation();

  const handlers = derived<Location, Handlers>(location, ([url, state]) => {
    return router.get(url, state) || []
  })

  setContext('svelte-router-internal-handlers', handlers)

  function toURL(url: string | URL) {
    if (typeof url === 'string') {
      url = new URL(url, $location[0])
    }
    url.host = $location[0].host
    return url
  }

  setContext('svelte-router', {
    preload: (url: string | URL) => router.preload(toURL(url), {}),
    navigate: (url: string | URL) => location.navigate(toURL(url), {}),
    redirect: (url: string | URL) => location.redirect(toURL(url), {}),
    back: () => location.back(),
    forward: () => location.forward()
  })

  function click(e: any) {
    let x = e.target.closest('a'), y = x && new URL(x.href);
    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || e.button || e.defaultPrevented) return;
    if (!y || x.target || !router.controlled(y.pathname) || y.host !== $location[0].host) return;
    e.preventDefault();
    if ($location[0].href === y.href) {
      location.redirect(y, {})
    } else {
      location.navigate(y, {})
    }
  }
</script>

<svelte:window
  on:click="{click}"
  on:popstate="{location.popstate}"
/>

<ChildRoute />
