<svelte:options tag="svelte-middleware"/>
<script>
  import { getContext, setContext } from 'svelte';
  import { writable } from 'svelte/store';

  import Empty from './Empty.svelte';
  export let component = Empty;
  export let path = '';
  export let data = {};

  const { route, query } = getContext('svelte-router');
  const parent = getContext('svelte-router-internals-parent');
  const parse = getContext('svelte-router-internals-parse');

  const full_path = `/${parent}/${path}`;
  const match = parse(full_path, true);
  const sub_matchers = writable([]);


  function middleware_parse(path, loose) {
    const match = parse(path, loose)
    if (!loose) {
      $sub_matchers = [...$sub_matchers, match];
    }
    return match
  }

  setContext('svelte-router-internals-parent', full_path);
  setContext('svelte-router-internals-parse', middleware_parse);

  $: params = $sub_matchers.some((m) => m($route)) && match($route);
</script>

<svelte:component
  this="{params ? component : Empty}"
  params="{params}"
  query="{$query}"
  path="{$route}"
  {...data}
>
  <slot></slot>
</svelte:component>
