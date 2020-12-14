<script>
  export let component = null;
  export let html;
</script>

{@html html}

<svelte:component this="{component}" {...$$restProps} />
