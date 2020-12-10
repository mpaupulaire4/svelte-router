import { createRouter, flattenRoute } from '../../src/Router'


describe('flattenRoute', () => {
  it('should flatten a route with no subroutes', () => {
    expect(flattenRoute({
      path: '/',
      handler: { name: 'index' }
    })).toEqual([
      { handlers: [{ name: 'index' }], path: '/'}
    ])
  })

  it('should flatten a route with subroutes', () => {
    expect(flattenRoute({
      path: '/',
      handler: { name: 'layout' },
      routes: [
        { path: '/about', handler: { name: 'about' }},
        { path: '/other', handler: { name: 'other' }}
      ]
    })).toEqual([
      { handlers: [{ name: 'layout' }, { name: 'about' }], path: '/about'},
      { handlers: [{ name: 'layout' }, { name: 'other' }], path: '/other'},
    ])
  })
})

describe('Router', () => {
  it('should match routes', async () => {
    const router = createRouter({
      routes: [
        {
          path: '/',
          handler: { name: 'index' }
        },
        {
          path: '/home',
          handler: { name: 'home' }
        },
        {
          path: '/post',
          handler: { name: 'post_layout' },
          routes: [
            {
              path: '/:id',
              handler: { name: 'post'}
            },
            {
              path: '/',
              handler: { name: 'posts'}
            },
          ]
        },
        {
          path: '/comment',
          routes: [
            {
              path: '/:id',
              handler: { name: 'comment'}
            },
            {
              path: '/',
              handler: { name: 'comments'}
            },
          ]
        },
      ]
    })

    expect(await router.change('')).toEqual([{ data: {}, name: 'index' }])
    expect(await router.change('/home')).toEqual([{ data: {}, name: 'home' }])
    expect(await router.change('/post')).toEqual([
      { data: {}, name: 'post_layout' },
      { data: {}, name: 'posts' },
    ])
    expect(await router.change('/post/1')).toEqual([
      { data: {}, name: 'post_layout' },
      { data: {}, name: 'post' },
    ])
    expect(await router.change('/comment')).toEqual([
      { data: {}, name: 'comments' },
    ])
    expect(await router.change('/comment/1')).toEqual([
      { data: {}, name: 'comment' },
    ])
    expect(await router.change('/any/other')).toEqual(null)
  })

  it('should allow you to add routes', async () => {
    const router = createRouter()
    router.add('/comment', { name: 'comments'})
    router.add('/comment/:id', { name: 'comment'})

    expect(await router.change('/comment')).toEqual([
      { data: {}, name: 'comments' },
    ])
    expect(await router.change('/comment/1')).toEqual([
      { data: {}, name: 'comment' },
    ])
    expect(await router.change('/any/other')).toEqual(null)
  })

  it('should return null for unmatched routes', async () => {
    const router = createRouter()
    router.add('/comment', { name: 'comments'})
    router.add('/comment/:id', { name: 'comment'})
    expect(await router.change('/any/other')).toEqual(null)
  })

  it('should return undefined for uncontrolled routes', async () => {
    const router = createRouter({ base: 'base' })
    router.add('/comment', { name: 'comments'})
    router.add('/comment/:id', { name: 'comment'})
    expect(await router.change('/any/other')).toEqual(undefined)
  })

  it('should handle async handlers', async () => {
    const router = createRouter({
      routes: [
        {
          path: '/',
          handler: () => Promise.resolve({ name: 'index' })
        },
      ]
    })

    expect(await router.change('')).toEqual([{ data: {}, name: 'index' }])
  })
  it('should handle async data', async () => {
    const router = createRouter({
      routes: [
        {
          path: '/',
          handler: {
            name: 'index',
            data: () => Promise.resolve({ some: 'data' })
          },
        },
        {
          path: '/home',
          handler: {
            name: 'home',
            data: () => ({ some: 'other.data' })
          },
        },
      ]
    })

    expect(await router.change('')).toEqual([{ data: { some: 'data' }, name: 'index' }])
    expect(await router.change('/home')).toEqual([{ data: { some: 'other.data' }, name: 'home' }])
  })

  it('should handle async data and handlers', async () => {
    const router = createRouter({
      routes: [
        {
          path: '/',
          handler: () => Promise.resolve({
            name: 'index',
            data: () => Promise.resolve({ some: 'data' })
          })
        },
      ]
    })

    expect(await router.change('')).toEqual([{ data: { some: 'data' }, name: 'index' }])
  })

  it('should allow passing extra information to data handlers', async () => {
    const mock = jest.fn((...args) => ({some: 'data'}))
    const router = createRouter({
      routes: [
        {
          path: '/',
          handler: {
            name: 'index',
            data: mock
          }
        },
      ]
    })

    expect(await router.change('', 'other', 'params')).toEqual([{ data: { some: 'data' }, name: 'index' }]);
    expect(mock).toHaveBeenCalledTimes(1);
    expect(mock).toHaveBeenCalledWith(
      {},
      'other',
      'params'
    );
  })
})
