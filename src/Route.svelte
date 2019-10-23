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
  const pattern = new URLPattern(`${base}${newSegment}`)
  setContext('svelte-router', {
    base,
    segment: newSegment
  })

  $: params = pattern.match($route);
  $: promise = params ? preload({ params, query: $query, path: $route }) : {};

</script>
{#if params}
  {#await promise then data}
    {#if component}
      <svelte:component this="{component}" params="{params}" query="{$query}" route="{$route}" {...data} />
    {:else}
      <slot params="{params}" query="{$query}" route="{$route}" {data} />
    {/if}
  {/await}
{/if}