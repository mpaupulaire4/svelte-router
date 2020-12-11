import { render } from '@testing-library/svelte'
// @ts-ignore
import type { Context } from './Context.svelte'
import ContextComp from './Context.svelte'

export function withContext(contexts: Context[]) {
  return (...[component, props, ...args]: Parameters<typeof render>) =>
    render(ContextComp, {component, contexts, ...props }, ...args)
}
