<script lang="ts">
  import type { Handler } from './Router'
  import type { createRouter } from './Router'
  import { getContext } from 'svelte'

  type Key<T, K extends keyof T> = T[K]

  const handlers = getContext<(Handler<any> | (() => Promise<Handler<any>>))[]>('svelte-router-internal-mapping')
  const path = getContext<string>('svelte-router-internal-path')
  const add = getContext<Key<ReturnType<typeof createRouter>, 'add'>>('svelte-router-internal-add')

  add(path, ...(handlers.map((h) => typeof f === 'function' ? h : () => h)))
</script>
