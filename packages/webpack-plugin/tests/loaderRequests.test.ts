import { getSiblingRequest } from '../src/utils'

describe('mini-program sibling requests', () => {
  test.each([
    ['', ''],
    ['app', './app'],
    ['./pages/index', './pages/index'],
    ['../pages/index', '../pages/index'],
    ['/pages/index', './/pages/index'],
    ['~component/index', 'component/index'],
    ['directory/~component/index', 'component/index'],
    ['app?value=~literal', './app?value=~literal'],
    [String.raw`C:\project\page`, String.raw`C:\project\page`],
    ['C:/project/page', 'C:/project/page'],
    [String.raw`\\server\share\page`, String.raw`\\server\share\page`],
  ])('preserves resolution of %s', (name, request) => {
    expect(getSiblingRequest(name)).toBe(request)
  })
})
