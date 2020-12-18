import { writable } from 'svelte/store'
import ChildRoute from '../../src/ChildRoute.svelte'
import Log from '../support/Log.svelte'
import { withContext } from '../support/helpers'

const store = writable([]);
const render = withContext([
  ['svelte-router-internal-handlers', store]
])

describe('ChildRoute.svelte', () => {
  it('shouldn\'t render if there are no handlers', () => {
    store.set([])
    const { container } = render(ChildRoute)
    expect(container).toHaveTextContent('')
  })

  it('should pass data as data prop', () => {
    store.set([
      { component: Log, data: 'I am an only child' }
    ])
    const { container } = render(ChildRoute)
    expect(container).toHaveTextContent('{ "data": "I am an only child" }')
  })

  it('should pass any props to component handler', () => {
    store.set([
      { component: Log }
    ])
    const { container } = render(ChildRoute, { text: 'the more the merrier' })
    expect(container).toHaveTextContent('{ "text": "the more the merrier" }')
  })

  it('should render all handlers', () => {
    store.set([
      { component: Log, data: 'one' },
      { component: Log, data: 'two' },
      { component: Log, data: 'three' },
      { component: Log, data: 'four' },
    ])
    const { container } = render(ChildRoute)
    expect(container).toHaveTextContent('{ "data": "one" } { "data": "two" } { "data": "three" } { "data": "four" }')
  })
})
