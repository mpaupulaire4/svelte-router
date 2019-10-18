<svelte:options tag="svelte-router"/>

<script>
  import { setContext } from 'svelte';
  import { readable, writable, get } from 'svelte/store';
  import { qsparse, handle_click } from './utils'

  export let base = ''

  const query = writable(qsparse(window.location.search));
  const route = writable(window.location.pathname);
  const context = {
    route,
    query,
    params: readable({}, () => () => {}),
    segment: '',
    history: window.history,
    base: base.replace(/^([^/])\/?$/, '/$1')
  }

  setContext('svelte-router', context)

  function popstate({state}) {
    $route = state.route
    $query = state.query
  }
</script>

<svelte:window
  on:click="{handle_click.bind(context)}"
  on:popstate="{popstate}"
/>

<slot></slot>