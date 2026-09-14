import { isUrlRequest, normalizeUrl, urlToRequest } from '../src/utils'

describe('WXSS URL compatibility', () => {
  test.each([
    ['image.png', true, true],
    ['../image.png', true, true],
    ['/images/logo.png', false, true],
    ['C:\\images\\logo.png', true, true],
    ['//cdn.example/image.png', false, false],
    ['https://cdn.example/image.png', false, false],
    ['data:image/png;base64,AA', false, false],
    ['#icon', false, false],
    ['{{image}}', false, false],
    ['~images/logo.png', true, true],
  ])('filters %s without changing root handling', (url, relative, root) => {
    expect(isUrlRequest(url as string)).toBe(relative)
    expect(isUrlRequest(url as string, true)).toBe(root)
  })

  test.each([
    ['', ''],
    ['image.png', './image.png'],
    ['./image.png', './image.png'],
    ['../image.png', '../image.png'],
    ['/image.png', './/image.png'],
    ['~@scope/images/logo.png', '@scope/images/logo.png'],
    ['image.png?name=~logo', './image.png?name=~logo'],
  ])('preserves the module request for %s', (url, request) => {
    expect(urlToRequest(url)).toBe(request)
  })

  test('normalizes escaped strings before resolving a URL', () => {
    expect(normalizeUrl('ima\\\nge%20name.png', true)).toBe('./image name.png')
  })
})
