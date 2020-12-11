import { writable } from 'svelte/store'
import ChildRoute from '../../src/ChildRoute.svelte'
import Text from '../support/Text.svelte'
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

  it('should render data as props', () => {
    store.set([
      { component: Text, data: { text: 'I am an only child' }}
    ])
    const { container } = render(ChildRoute)
    expect(container).toHaveTextContent('I am an only child')
  })

  it('should pass any props to component handler', () => {
    store.set([
      { component: Text, data: {} }
    ])
    const { container } = render(ChildRoute, { text: 'the more the merrier' })
    expect(container).toHaveTextContent('the more the merrier')
  })

  it('should render all handlers', () => {
    store.set([
      { component: Text, data: {} },
      { component: Text, data: {} },
      { component: Text, data: {} },
      { component: Text, data: {} },
    ])
    const { container } = render(ChildRoute)
    expect(container).toHaveTextContent('test test test test')
  })
})
