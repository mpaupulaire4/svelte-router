<svelte:options tag="svelte-middleware"/>
<script>
  import { setContext, getContext } from 'svelte';
  import Empty from './Empty.svelte';

  export let prefetch = null;
  export let component = Empty;
  export let path = '';

  const { base, register_route } = getContext('svelte-router-internals-consts');
  const parent = getContext('svelte-router-internals-parent');
  const parse = getContext('svelte-router-internals-parse');
  setContext('svelte-router-internals-parent', `${paremt}/${path}`)
  const { route, query } = getContext('svelte-router');

  const full_path = `${base}/${paremt}/${path}`;

  export let key = full_path;

  const data = register_route(full_path, {
    key,
    prefetch,
    middleware: true
  });

  const match = parse(full_path);
  $: params = match($route);
</script>

<svelte:component
  this="{params && component}"
  params="{params}"
  query="{$query}"
  path="{$route}"
  {...$data}
>
  <slot
    params="{params}"
    query="{$query}"
    path="{$route}"
    data={$data}
  />
</svelte:component>
