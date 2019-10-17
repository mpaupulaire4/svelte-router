<svelte:options tag="svelte-router"/>
<script context="module">
  import { writable } from 'svelte/store';
  import { parse } from 'qs';

  const qsparse = (search) => {
    return parse(search, {
      ignoreQueryPrefix: true,
      plainObjects: true
    })
  }

  export const query = writable(qsparse(window.location.search));
  export const route = writable(window.location.pathname);

  function which(event) {
    return event.which === null ? event.button : event.which;
  }

  function find_anchor(node) {
    while (node && node.nodeName.toUpperCase() !== 'A')
      node = node.parentNode; // SVG <a> elements have a lowercase name
    return node;
  }
</script>

<script>
  import { setContext } from 'svelte';
  import { readable } from 'svelte/store';

  export let base = ''

  setContext('svelte-router', {
    route,
    query,
    params: readable({}, () => () => {}),
    segment: '',
    base: base.replace(/^([^/])\/?$/, '/$1')
  })

  function handle_click(event) {
    // Adapted from https://github.com/visionmedia/page.js
    // MIT license https://github.com/visionmedia/page.js#license
    if (which(event) !== 1) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey) return;
    if (event.defaultPrevented) return;

    const a = find_anchor(event.target);
    if (!a) return;
    if (!a.href) return;

    // check if link is inside an svg
    // in this case, both href and target are always inside an object
    const svg = typeof a.href === 'object' && a.href.constructor.name === 'SVGAnimatedString';
    const href = String(svg ? (a).href.baseVal : a.href);

    if (href === location.href) {
      if (!location.hash) event.preventDefault();
      return;
    }

    // Ignore if tag has
    // 1. 'download' attribute
    // 2. rel='external' attribute
    if (a.hasAttribute('download') || a.getAttribute('rel') === 'external') return;

    // Ignore if <a> has a target
    if (svg ? (a).target.baseVal : a.target) return;

    const url = new URL(href);

    // Don't handle hash changes, origin changes, or
    // routes outside specified root
    if (url.origin !== location.origin) return;
    if (!url.pathname.startsWith(base)) return;
    if (url.pathname === location.pathname && url.search === location.search) return;
    event.preventDefault();
    window.history.pushState('', '', url.href);
    $route = url.pathname
    $query = qsparse(url.search)
  }

  function popstate({state}) {
    $route = window.location.pathname
    $query = qsparse(window.location.search)
  }
</script>

<svelte:window on:popstate="{popstate}" on:click="{handle_click}"/>

<slot></slot>