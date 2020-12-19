import { render } from '@testing-library/svelte'
// @ts-ignore
import type { Context } from './Context.svelte'
import ContextComp from './Context.svelte'
import HTMLComp from './HTML.svelte'

export function withContext(contexts: Context[]) {
  return (...[component, props, ...args]: Parameters<typeof render>) =>
    render(ContextComp, { component, contexts, ...props }, ...args)
}

export function withHTML(html: string) {
  return (...[component, props, ...args]: Parameters<typeof render>) =>
    render(HTMLComp, { component, html, ...props }, ...args)
}
