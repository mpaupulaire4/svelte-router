import type { Readable } from 'svelte/store'
import { writable } from 'svelte/store';

export interface Location extends Readable<[URL, any]> {
  navigate(url: URL, state?: any): void
  redirect(url: URL, state?: any): void
  back(): void
  forward(): void
  popstate?(event: PopStateEvent): void
}

export function createHistoryLocation(initialState: any = {}): Location {
  const { subscribe, set } = writable<[URL, any]>([new URL(window.location.href), initialState])
  return {
    subscribe,
    navigate(url, state) {
      window.history.pushState({state, href: url.href}, '', url.href);
      set([url, state])
    },
    redirect(url, state) {
      window.history.replaceState({state, href: url.href}, '', url.href);
      set([url, state])
    },
    back: () => window.history.back,
    forward: () => window.history.forward,
    popstate(e: PopStateEvent) {
      set([new URL(e.state.href), e.state.ctx])
    }
  }
}
