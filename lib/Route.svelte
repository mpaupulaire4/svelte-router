<script lang="ts">
  import type { Readable } from 'svelte/store';

  import { getContext, setContext, type ComponentType } from 'svelte';

  const handlers = getContext<Readable<[ComponentType, unknown][]>>(
    'svelte-router-internal-handlers'
  );
  const index = getContext<number>('svelte-router-internal-index') || 0;
  setContext('svelte-router-internal-index', index + 1);

  $: handler = $handlers?.[index];
</script>

{#if handler}
  <svelte:component this={handler[0]} data={handler[1]} {...$$props}>
    <svelte:self />
  </svelte:component>
{/if}
