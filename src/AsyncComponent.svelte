<script>
  export let fetch = () => null;
  export let props = {};
</script>
{#await fetch() then component}
  <svelte:component this="{component}" {...props} >
    <slot />
  </svelte:component>
{/await}
