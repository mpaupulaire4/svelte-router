<svelte:options tag="svelte-middleware"/>
<script>
  import { getContext, setContext } from 'svelte';

  import { register_middleware } from './Router.svelte';
  import Empty from './Empty.svelte';
  export let component = Empty;
  export let path = '';

  const { route, query } = getContext('svelte-router');
  const parent = getContext('svelte-router-internals-parent');
  const full_path = `/${parent}/${path}`;
  const params = register_middleware(full_path);
  setContext('svelte-router-internals-parent', full_path);
</script>

<svelte:component
  this="{$params ? component : Empty}"
  params="{$params}"
  query="{$query}"
  path="{$route}"
  {...$$props}
>
  <slot
    params="{params}"
    query="{$query}"
    path="{$route}"
  />
</svelte:component>
