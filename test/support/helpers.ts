import { render } from '@testing-library/svelte';
import ContextComp from './Context.svelte';
import InternalComp from './Internal.svelte';
import type { getInternal } from 'lib/utils';
// import { writable } from '@crikey/stores-strict/dist/index';
import type { Readable, Writable } from 'svelte/store';
import { writable } from 'svelte/store';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Context<T = any> = [string, T];

export function withContext(context: Context) {
  return (...[component, props, ...args]: Parameters<typeof render>) =>
    render(ContextComp, { props: { component, context, ...props } }, ...args);
}

type AsWritable<T> = T extends Readable<infer U> ? Writable<U> : Writable<T>;
type Internal = AsWritable<ReturnType<typeof getInternal>>;

export function withInternal() {
  const context: Internal = writable(['', {}, null]);
  const newRender = (...[component, props, ...args]: Parameters<typeof render>) => {
    return render(InternalComp, { props: { component, context, ...props } }, ...args);
  };
  return [newRender, context] as const;
}
