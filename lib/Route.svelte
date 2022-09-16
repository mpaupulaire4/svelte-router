<script>
  import { getContext, setContext } from 'svelte';

  /** @type {import('svelte/store').Readable<Array<[import('svelte').ComponentType, unknown]>>} */
  const handlers = getContext('svelte-router-internal-handlers');
  /** @type number */
  const index = getContext('svelte-router-internal-index') || 0;
  setContext('svelte-router-internal-index', index + 1);

  $: handler = $handlers?.[index];
</script>

{#if handler}
  <svelte:component this={handler[0]} data={handler[1]} {...$$props}>
    <svelte:self />
  </svelte:component>
{/if}
