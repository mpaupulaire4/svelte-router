<script lang="ts" context="module">
  const indexKey = 'svelte-router-internal-index';
</script>

<script lang="ts">
  import { getContext, setContext } from 'svelte';
  import { getInternal } from './utils';

  const internal = getInternal();
  const index = getContext<number>(indexKey) || 0;
  setContext(indexKey, index + 1);

  $: handler = $internal?.[2]?.[index];
</script>

{#if handler}
  <svelte:component this={handler[0]} data={handler[1]} {...$$props}>
    <svelte:self />
  </svelte:component>
{/if}
