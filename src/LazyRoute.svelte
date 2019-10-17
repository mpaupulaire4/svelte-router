<svelte:options tag="svelte-lazy-route"/>
<script>
  import { setContext, getContext } from 'svelte';
  import { derived } from 'svelte/store';
  import URLPattern from 'url-pattern';

  function resolve() {
    return Promise.resolve({})
  }

  export let promise = resolve()
  export let load = () => promise
  export let absolute = false
  export let path = '*'

  const { route, query, segment, params, base } = getContext('svelte-router')
  const newSegment = `${absolute ? '' : segment}/${path.replace(/^\//, '')}`
  const pattern = new URLPattern(newSegment)
  const p = derived([params, route], ([$params, $route]) => {
    const params = pattern.match(`${base}${$route}`);
    if (params) {
      return {
        ...$params,
        ...params
      };
    }
    return false;
  })
  setContext('svelte-router', {
    route,
    query,
    params: p,
    segment: newSegment
  })

</script>
{#if $p}
  {#await load() then mod}
    {#await (mod.preload || resolve)() then data}
      <svelte:component this="{mod.component}" params="{$p}" query="{$query}" route="{$route}" {...data} />
    {/await}
  {/await}
{/if}