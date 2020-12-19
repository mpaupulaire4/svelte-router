import { createRouter, flattenRoute } from '../../src/Router'

const toURL = (path: string) => new URL(path, 'http://www.example.com')

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
  it('should match routes', () => {
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

    expect(router.get(toURL(''))).toEqual([{ name: 'index' }])
    expect(router.get(toURL('/home'))).toEqual([{ name: 'home' }])
    expect(router.get(toURL('/post'))).toEqual([
      { name: 'post_layout' },
      { name: 'posts' },
    ])
    expect(router.get(toURL('/post/1'))).toEqual([
      { name: 'post_layout' },
      { name: 'post' },
    ])
    expect(router.get(toURL('/comment'))).toEqual([
      { name: 'comments' },
    ])
    expect(router.get(toURL('/comment/1'))).toEqual([
      { name: 'comment' },
    ])
    expect(router.get(toURL('/any/other'))).toEqual(null)
  })

  it('should allow you to add routes', () => {
    const router = createRouter()
    router.add('/comment', { name: 'comments'})
    router.add('/comment/:id', { name: 'comment'})

    expect(router.get(toURL('/comment'))).toEqual([
      { name: 'comments' },
    ])
    expect(router.get(toURL('/comment/1'))).toEqual([
      { name: 'comment' },
    ])
    expect(router.get(toURL('/any/other'))).toEqual(null)
  })

  it('should return null for unmatched routes', () => {
    const router = createRouter()
    router.add('/comment', { name: 'comments'})
    router.add('/comment/:id', { name: 'comment'})
    expect(router.get(toURL('/any/other'))).toEqual(null)
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

    const result = router.get(toURL(''))
    expect(result[0]).toBeInstanceOf(Promise)
    expect(await result[0]).toEqual({ name: 'index' })
  })
  it('should handle data methods', async () => {
    const router = createRouter({
      routes: [
        {
          path: '/',
          handler: () => Promise.resolve({
            name: 'index',
            data: () => ({ some: 'data' })
          }),
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

    expect(await Promise.all(router.get(toURL('')))).toEqual([{ data: { some: 'data' }, name: 'index' }])
    expect(router.get(toURL('/home'))).toEqual([{ data: { some: 'other.data' }, name: 'home' }])
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

    expect(await router.get(toURL(''), 'other', 'params')).toEqual([{ data: { some: 'data' }, name: 'index' }]);
    expect(mock).toHaveBeenCalledTimes(1);
    expect(mock).toHaveBeenCalledWith(
      {
        params: {},
        path: '/',
        query: '',
      },
      'other',
      'params'
    );
  })
})
