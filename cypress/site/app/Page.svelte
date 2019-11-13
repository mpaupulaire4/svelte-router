<script>
  export let params;
  export let path;
  export let query;
  export let data = {};
</script>

<svelte:head>
  <title>{path.replace('/', ' ')}</title>
</svelte:head>

<h1>{data.page}</h1>
<span> path: {path}</span>
<pre id="params">{JSON.stringify(params, null, 2)}</pre>
<pre id="query">{JSON.stringify(query, null, 2)}</pre>
<slot />