<svelte:options tag="svelte-route"/>
<script>
  import { getContext } from 'svelte';

  import Empty from './Empty.svelte';
  export let component = Empty;
  export let path = '';
  export let props = {};

  const { route, query } = getContext('svelte-router');
  const parent = getContext('svelte-router-internals-parent');
  const parse = getContext('svelte-router-internals-parse');

  const match = parse(`/${parent}/${path}`);

  $: params = match($route);
</script>

<svelte:component
  this="{params && component}"
  params="{params}"
  query="{$query}"
  path="{$route}"
  {...props}
>
  <slot
    params="{params}"
    query="{$query}"
    path="{$route}"
  />
</svelte:component>