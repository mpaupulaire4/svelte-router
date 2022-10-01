<script lang="ts">
  import { getInternal, setInternal } from 'lib/utils';
  import type { ComponentType } from 'svelte';

  export let context: ReturnType<typeof getInternal>;
  export let component: ComponentType;

  setInternal(context);
</script>

<svelte:component this={component} {...$$restProps} />
