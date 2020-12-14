<script lang="ts">
  import type { Readable } from 'svelte/store'
  import type { Handlers } from './Router.svelte'
  import { getContext, setContext } from "svelte";

  const handlers = getContext<Readable<Handlers>>('svelte-router-internal-handlers')
  const index = getContext<number>('svelte-router-internal-index') || 0
  setContext('svelte-router-internal-index', index + 1)

  $: handlerP = $handlers[index] || { component: null, data: {} }

</script>

{#await handlerP}
<slot />
{:then handler}
<svelte:component this="{handler.component}" {...handler.data} {...$$props}>
  <svelte:self/>
</svelte:component>
{/await}
