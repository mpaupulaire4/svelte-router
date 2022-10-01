<script lang="ts">
  import { useRoutes, Route } from 'lib';
  import Home from './lib/Home.svelte';
  import Page from './lib/Page.svelte';

  useRoutes([
    {
      path: '/',
      component: Home,
    },
    {
      path: '/one',
      component: Page,
    },
    {
      path: '/one',
      component: Page,
    },
    {
      path: '/one',
      component: Page,
    },
  ], '');
</script>

<ul>
  <li>
    <a href="/">Home</a>
  </li>
  <li>
    <a href="/one">One</a>
  </li>
  <li>
    <a href="/two">two</a>
  </li>
  <li>
    <a href="/three">three</a>
  </li>
</ul>

<Route />
