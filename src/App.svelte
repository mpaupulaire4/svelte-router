<script lang="ts">
  import { useRoutes, Route } from 'lib';
  import Home from './lib/Home.svelte';
  // import data from 'virtual:fs-routes';

  useRoutes([
    {
      path: '/',
      component: Home,
    },
  ]);
</script>

<Route />

