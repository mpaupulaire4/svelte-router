<svelte:options tag="svelte-middleware"/>
<script>
  import { getContext, setContext } from 'svelte';

  import { register_route } from './Router.svelte';
  import Empty from './Empty.svelte';
  export let component = Empty;
  export let path = '';
  export let props = {};

  const parent = getContext('svelte-router-internals-parent');

  const full_path = `/${parent}/${path}`;
  const params = register_route(full_path, true);

  setContext('svelte-router-internals-parent', full_path);
</script>

<svelte:component
  this="{$params ? component : Empty}"
  {...props}
>
  <slot />
</svelte:component>
