<svelte:options tag="svelte-route"/>
<script>
  import { setContext, getContext } from 'svelte';

  import { route, query, register } from './Router.svelte';
  import Empty from './Empty.svelte';

  export let prefetch = null;
  export let component = Empty;
  export let path = '*';
  export let exact = false;
  export let absolute = false;
  export let key = null;

  const { segment, base, } = getContext('svelte-router-internals')
  const newSegment = `${absolute ? '' : segment.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
  setContext('svelte-router-internals', {
    base,
    segment: newSegment
  })

  const full_path = `${base}${newSegment}${exact ? '' : '*'}`;

  const { data, pattern } = register(key, {
    path: full_path,
    prefetch,
  });

  $: params = pattern.match($route);
</script>

<svelte:component this="{params ? component : Empty}" params="{params}" query="{$query}" route="{$route}" {...$data} >
  <slot params="{params}" query="{$query}" route="{$route}" data={$data} />
</svelte:component>