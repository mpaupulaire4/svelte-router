<script lang="ts">
  import type { Readable } from 'svelte/store'
  import type { ActiveHandler } from './Router'
  import { getContext, setContext } from "svelte";


  const handlers = getContext<Readable<ActiveHandler<any>[]>>('svelte-router-internal-handlers')
  const index = getContext<number>('svelte-router-internal-index')
  setContext('svelte-router-internal-index', index + 1)

  $: handler = $handlers[index] || { component: null, data: {} }

</script>

<svelte:component this="{handler.component}" {...handler.data} {...$$props}>
  <svelte:self/>
</svelte:component>
