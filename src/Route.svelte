<svelte:options tag="svelte-route"/>
<script>
  import { getContext } from 'svelte';

  import { register_route, route, query } from './Router.svelte';
  import Empty from './Empty.svelte';
  export let component = Empty;
  export let path = '';
  export let props = {};

  const parent = getContext('svelte-router-internals-parent');

  const params = register_route(`/${parent}/${path}`);

</script>

<svelte:component
  this="{$params && component}"
  {...props}
>
  <slot
    params="{$params}"
    query="{$query}"
    path="{$route}"
  />
</svelte:component>