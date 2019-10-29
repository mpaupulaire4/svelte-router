<svelte:options tag="svelte-route"/>
<script>
  import { setContext, getContext } from 'svelte';
  import { derived } from 'svelte/store';
  import URLPattern from 'url-pattern';

  import { route, query, register, unregister } from './Router.svelte';
  import Empty from './Empty.svelte';

  export let preload = () => ({});
  export let component = Empty;
  export let path = '*';
  export let exact = false;
  export let absolute = false;

  const { segment, base, ...rest } = getContext('svelte-router')
  const newSegment = `${absolute ? '' : segment.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
  const pattern = new URLPattern(`${base}${newSegment}${exact ? '' : '*'}`)
  setContext('svelte-router', {
    ...rest,
    base,
    segment: newSegment
  })

  $: params = pattern.match($route);
  $: promise = params ? preload({ params, query: $query, path: $route }) : {};
</script>

{#if params}
  {#await promise then data}
    <svelte:component this="{component}" params="{params}" query="{$query}" route="{$route}" {...data} >
      <slot params="{params}" query="{$query}" route="{$route}" {data} />
    </svelte:component>
  {/await}
{:else if component !== Empty}
  <slot />
{/if}