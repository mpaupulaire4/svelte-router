<svelte:options tag="svelte-route"/>
<script>
  import { setContext, getContext } from 'svelte';
  import { derived } from 'svelte/store';
  import URLPattern from 'url-pattern';
  import { route, query } from './Router.svelte';

  export let preload = () => ({})
  export let component = null
  export let absolute = false
  export let path = '*'

  const { segment, base } = getContext('svelte-router')
  const newSegment = `${absolute ? '' : segment}/${path.replace(/^\//, '')}`
  const pattern = new URLPattern(newSegment)
  const params = derived(route, ($route) => pattern.match(`${base}${$route}`));
  setContext('svelte-router', {
    base,
    params,
    segment: newSegment
  })

</script>
{#if $params}
  {#await preload({params: $params, query: $query, path: $route}) then data}
    {#if component}
      <svelte:component this="{component}" params="{$params}" query="{$query}" route="{$route}" {...data} />
    {:else}
      <slot params="{$params}" query="{$query}" route="{$route}" {data} />
    {/if}
  {/await}
{/if}