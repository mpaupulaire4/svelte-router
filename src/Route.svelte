<svelte:options tag="svelte-route"/>
<script>
  import { setContext, getContext } from 'svelte';
  import { derived } from 'svelte/store';
  import URLPattern from 'url-pattern';

  export let preload = () => ({})
  export let component = null
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
  {#await preload({params: $p, query: $query, path: $route}) then data}
    {#if component}
      <svelte:component this="{component}" params="{$p}" query="{$query}" route="{$route}" {...data} />
    {:else}
      <slot params="{$p}" query="{$query}" route="{$route}" {data} />
    {/if}
  {/await}
{/if}