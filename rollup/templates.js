const template = require('lodash.template');


const ssr = {
  imprt: template('import ${ name } from "${ file }";'),
  script: template('export let ${ name }_props = null;'),
  middleware: template(`
  <Middleware
    path="<%= path %>"
    component="{<%= name %>}"
    props="{<%= name %>_props}"
  >
    <% children.forEach((chhild) => { %>
      <%= chhild %>
    <% }) %>
  <Middleware />
  `.trim()),
  route: template(`
  <Route
    path="<%= path %>"
    component="{<%= name %>}"
    props="{<%= name %>_props}"
  >
  `.trim()),
}
const client_split = {
  imprt: template(''),
  script: template(`
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
    <% children.forEach((chhild) => { %>
      <%= chhild %>
    <% }) %>
  <Middleware />
`.trim()),
  route: template(`
<Route
  path="<%= path %>"
  component="{AsyncComponent}"
  props="{{ fetch: <%= name %>_store.component, props: $<%= name %>_store}}"
/å>
`.trim()),
}

const client = {
  imprt: template('import * as ${ name } from "${ file }";'),
  script: template(`
export let <%= name %>_props = null;
const <%= name %>_store = register_preload('<%= path %>', <%= name %>.prefetch, { initial: <%= name %>_props })
`.trim()),
  middleware: template(`
  <Middleware
    path="<%= path %>"
    component="{<%= name %>.default}"
    props="{$<%= name %>_store}"
  >
    <% children.forEach((chhild) => { %>
      <%= chhild %>
    <% }) %>
  <Middleware />
`.trim()),
  route: template(`
<Route
  path="<%= path %>"
  component="{<%= name %>.default}"
  props="{$<%= name %>_store}"
/å>
`.trim()),
}

module.exports = {
  ssr,
  client_split,
}