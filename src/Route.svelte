<svelte:options tag="svelte-route"/>
<script>
  import { setContext, getContext } from 'svelte';

  import { register } from './Router.svelte';
  import Empty from './Empty.svelte';

  export let prefetch = null;
  export let component = Empty;
  export let path = '';
  export let exact = true;
  export let absolute = false;

  const base = getContext('svelte-router-internals-base');
  const parent = getContext('svelte-router-internals-parent');
  const { route, query } = getContext('svelte-router');

  const full_path = `${base}/${absolute ? paremt : ''}/${path}`;

  export let key = full_path;

  const { data, match } = register({
    key,
    exact,
    path: full_path,
    prefetch,
  });

  $: params = match($route);
</script>

<svelte:component
  this="{params ? component : Empty}"
  params="{params}"
  query="{$query}"
  path="{$route}"
  data="{$data}"
>
  <slot
    params="{params}"
    query="{$query}"
    path="{$route}"
    data={$data}
  />
</svelte:component>