import { Volume } from 'memfs'
import { ResolverFactory } from 'enhanced-resolve'
import MiniprogramResolverPlugin from '../MiniprogramResolverPlugin'

describe('resolver roots', () => {
  let resolver: ReturnType<typeof ResolverFactory.createResolver>

  beforeEach(() => {
    const fileSystem = Volume.fromJSON(
      {
        '/virtualRoot/a/index': '',
        '/virtualRoot/a/dir/index': '',
        '/virtualRoot/c/index': '',
        '/virtualRoot/c/dir/index': '',
        '/a/index': '',
        '/a/dir/index': '',
        '/b/index': '',
        '/b/dir/index': '',
      },
      '/',
    )
    resolver = ResolverFactory.createResolver({
      useSyncFileSystemCalls: true,
      fileSystem: fileSystem as any,
      plugins: [new MiniprogramResolverPlugin({ roots: ['/virtualRoot'] })],
    })
  })

  test('should resolve', async () => {
    expect(resolver.resolveSync({}, '/', '/a')).toEqual('/virtualRoot/a/index')
    expect(resolver.resolveSync({}, '/', '/a/index')).toEqual('/virtualRoot/a/index')
    expect(resolver.resolveSync({}, '/', '/a/dir')).toEqual('/virtualRoot/a/dir/index')
    expect(resolver.resolveSync({}, '/', '/a/dir/index')).toEqual('/virtualRoot/a/dir/index')
  })

  test('should fallback to real root', async () => {
    expect(resolver.resolveSync({}, '/', '/b')).toEqual('/b/index')
    expect(resolver.resolveSync({}, '/', '/b/index')).toEqual('/b/index')
    expect(resolver.resolveSync({}, '/', '/b/dir')).toEqual('/b/dir/index')
    expect(resolver.resolveSync({}, '/', '/b/dir/index')).toEqual('/b/dir/index')
  })
})
