const template = require('lodash.template');

const ssr = {
  imports: template('import ${ name } from "${ file }";'),
  scripts: template('export let ${ name }_props = null;'),
  middleware: template(`
<Middleware
  path="<%= path %>"
  component="{<%= name %>}"
  props="{<%= name %>_props}"
>
<%= children %>
</Middleware>
  `.trim()),
  route: template(`
<Route
  path="<%= path %>"
  component="{<%= name %>}"
  props="{<%= name %>_props}"
/>
  `.trim()),
}
const client_split = {
  imports: template(''),
  scripts: template(`
const <%= name %>_store = register_preload('<%= path %>', async (...args) => {
  const prefetch = (await import('<%= file %>')).prefetch;
  return prefetch ? await prefetch(...args) : {}
})
<%= name %>_store.component = async () => (await import('<%= file %>')).default
`.trim()),
  middleware: template(`
<Middleware
  path="<%= path %>"
  component="{AsyncComponent}"
  props="{{ fetch: <%= name %>_store.component, props: $<%= name %>_store}}"
>
<%= children %>
</Middleware>
`.trim()),
  route: template(`
<Route
  path="<%= path %>"
  component="{AsyncComponent}"
  props="{{ fetch: <%= name %>_store.component, props: $<%= name %>_store}}"
/>
`.trim()),
}

const client = {
  imports: template('import * as ${ name } from "${ file }";'),
  scripts: template(`
export let <%= name %>_props = null;
const <%= name %>_store = register_preload('<%= path %>', <%= name %>.prefetch, { initial: <%= name %>_props })
`.trim()),
  middleware: template(`
<Middleware
  path="<%= path %>"
  component="{<%= name %>.default}"
  props="{$<%= name %>_store}"
>
<%= children %>
</Middleware>
`.trim()),
  route: template(`
<Route
  path="<%= path %>"
  component="{<%= name %>.default}"
  props="{$<%= name %>_store}"
/>
`.trim()),
}

module.exports = {
  ssr,
  client,
  client_split,
}