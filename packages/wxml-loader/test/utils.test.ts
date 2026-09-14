import { interpolateName } from 'loader-utils'
import { LoaderContext } from 'webpack'
import { preserveHashAlgorithm, urlToRequest } from '../src/utils'

describe('WXML request and asset naming compatibility', () => {
  test.each([
    ['', ''],
    ['image.png', './image.png'],
    ['./image.png', './image.png'],
    ['../image.png', '../image.png'],
    ['/images/logo.png', '/images/logo.png'],
    ['C:\\images\\logo.png', 'C:\\images\\logo.png'],
    ['~@scope/images/logo.png', '@scope/images/logo.png'],
    ['image.png?name=~logo', './image.png?name=~logo'],
  ])('preserves the request for %s', (url, request) => {
    expect(urlToRequest(url)).toBe(request)
  })

  // Values captured from loader-utils 2.0.4 before its default hash algorithm changed.
  test.each([
    ['[hash]', '893bf1b111ef995b682a9147ba244a88'],
    ['[hash:8]', '893bf1b1'],
    ['[contenthash:base64:8]', 'iTvxsRHv'],
    ['[md5:hash:8]', '269452ac'],
    ['[name].[hash:8].[ext]', 'name.893bf1b1.wxml'],
    ['[path][name][query]', 'views/name?x'],
  ])('keeps the filename emitted for %s', (name, filename) => {
    const context = { resourcePath: '/project/views/name.wxml', resourceQuery: '?x' } as LoaderContext<object>
    expect(
      interpolateName(context, preserveHashAlgorithm(name), {
        context: '/project',
        content: Buffer.from('<view>hash fixture</view>'),
      }),
    ).toBe(filename)
  })
})
