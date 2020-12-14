import type { Location } from '../../src/Location'
import Router from '../../src/Router.svelte'
import { createRouter } from '../../src/Router'
import { withHTML } from '../support/helpers'
import { fireEvent } from '@testing-library/svelte'

let url = new URL('http://localhost/home')
const mockLocation: Location = {
  subscribe: jest.fn((fn) => {
    fn([url, {}])
    return () => {}
  }),
  navigate: jest.fn(),
  redirect: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  popstate: jest.fn(),
}

const render = withHTML(`
  <a href="/home/">Home Link</a>
  <a href="/home/about">About Link</a>
  <a href="http://www.example.com">External Link</a>
  <a href="/some/other/route">Uncontrolled Link</a>
`)

describe('Router.svelte', () => {
  it('should mount the popstate listener to the window if they exist', () => {
    render(Router, {
      location: mockLocation,
      router: createRouter()
    })
    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }))
    expect(mockLocation.popstate).toHaveBeenCalled()
  })

  describe('link click handler', () => {
    it('should ignore uncontrolled and external links', () => {
      const { getByText } = render(Router, {
        location: mockLocation,
        router: createRouter({ base: 'home' })
      })

      fireEvent.click(getByText('External Link'))
      expect(mockLocation.redirect).not.toHaveBeenCalled()
      expect(mockLocation.navigate).not.toHaveBeenCalled()
    })

    it('should redirect when linking to current location', () => {
      const { getByText } = render(Router, {
        location: mockLocation,
        router: createRouter({ base: 'home' })
      })

      fireEvent.click(getByText('Home Link'))
      expect(mockLocation.redirect).toHaveBeenCalled()
      expect(mockLocation.navigate).not.toHaveBeenCalled()
    })

    it('should navigate when linking to a different location', () => {
      const { getByText } = render(Router, {
        location: mockLocation,
        router: createRouter({ base: 'home' })
      })

      fireEvent.click(getByText('About Link'))
      expect(mockLocation.redirect).not.toHaveBeenCalled()
      expect(mockLocation.navigate).toHaveBeenCalled()
    })
  })
})
