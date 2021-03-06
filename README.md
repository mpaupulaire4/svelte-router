# Svelte Router
<!-- ![](https://github.com/mpaupulaire4/svelte-router/workflows/Tests/badge.svg) -->

A simple client side router written in svelte.

# TODO

* [x] usable in srr components (no strict dependency on window)
* [x] route preloading on link hover/mousedown
* [x] preloading store
* [ ] Docs
* [ ] Tests
* [ ] route errors (404 page and what not)
* [ ] renderless redirect component
* [ ] Switch component (renders the first path to match)

## Consuming components

Your package.json has a `"svelte"` field pointing to `src/index.js`, which allows Svelte apps to import the source code directly, if they are using a bundler plugin like [rollup-plugin-svelte](https://github.com/rollup/rollup-plugin-svelte) or [svelte-loader](https://github.com/sveltejs/svelte-loader) (where [`resolve.mainFields`](https://webpack.js.org/configuration/resolve/#resolve-mainfields) in your webpack config includes `"svelte"`). **This is recommended.**

For everyone else, `npm run build` will bundle your component's source code into a plain JavaScript module (`index.mjs`) and a UMD script (`index.js`). This will happen automatically when you publish your component to npm, courtesy of the `prepublishOnly` hook in package.json.
