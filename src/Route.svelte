<script lang="ts">
  import type { Handler } from './Router'
  import {setContext, getContext} from 'svelte'
  import Done from './Done.svelte'
  import { strip } from './Recognizer'

  type Key<T, K extends keyof T> = T[K];

  export let path: string = ''

  const handler: Handler<any> = {
    ...$$restProps as Handler<any>,
  }

  if (handler.component) {
    setContext(
      'svelte-router-internal-mapping',
      getContext<Handler<any>[]>('svelte-router-internal-mapping').concat(handler)
    )
  }

  setContext(
    'svelte-router-internal-path',
    getContext<string>('svelte-router-internal-path').concat(strip(path), '/')
  )

</script>

<slot>
  <Done/>
</slot>
