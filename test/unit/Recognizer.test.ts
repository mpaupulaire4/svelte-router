import { strip, createRecognizer } from '../../src/Recognizer'


describe('Recognizer', () => {
  it('should detect whether a route is contolled or not', () => {
    let { controlled } = createRecognizer('base')
    expect(controlled('/base')).toBe(true)
    expect(controlled('/base/other/path')).toBe(true)
    expect(controlled('/')).toBe(false)
  })
})

describe('strip', () => {
  it('should strip the leading and trailing slash from strings', () => {
    expect(strip('/')).toBe('')
    expect(strip('home')).toBe('home')
    expect(strip('/home')).toBe('home')
    expect(strip('home/')).toBe('home')
    expect(strip('/home/')).toBe('home')
    expect(strip('/home/other/')).toBe('home/other')
    expect(strip('/home/other/')).toBe('home/other')
  })
})
