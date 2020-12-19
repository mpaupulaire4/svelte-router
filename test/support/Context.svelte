<script context="module" lang="ts">
  export type Context = [string, any];
</script>

<script lang="ts">
  import { setContext } from 'svelte'

  export let contexts: Context[] = []
  export let component: any = null

  for (let context of contexts) {
    setContext(context[0], context[1])
  }
</script>

<svelte:component this="{component}" {...$$restProps}/>
