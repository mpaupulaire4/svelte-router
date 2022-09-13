<script lang="ts">
  import { setContext } from 'svelte';
  import type { Context } from './helpers';

  export let context: Context = ['none', null];
  export let component: any = null;

  setContext(context[0], context[1]);
</script>

<svelte:component this={component} {...$$restProps} />
