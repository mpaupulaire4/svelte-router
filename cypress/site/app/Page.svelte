<script>
  export let params;
  export let route;
  export let query;
  export let page;
</script>

<svelte:head>
  <title>{route.replace('/', ' ')}</title>
</svelte:head>

<h1>{page}</h1>
<span> route: {route}</span>
<pre id="params">{JSON.stringify(params, null, 2)}</pre>
<pre id="query">{JSON.stringify(query, null, 2)}</pre>