import { Volume } from 'memfs'
import { ResolverFactory } from 'enhanced-resolve'
import MiniprogramResolverPlugin from '../MiniprogramResolverPlugin'

describe('resolver moduleToRelative', () => {
  let resolver: ReturnType<typeof ResolverFactory.createResolver>

  beforeEach(() => {
    const fileSystem = Volume.fromJSON(
      {
        '/a/index': '',
        '/a/dir/index': '',
        '/b/index': '',
        '/b/dir/index': '',
        '/c/index': '',
        '/c/dir/index': '',
        '/node_modules/c/index': '',
        '/node_modules/c/dir/index': '',
      },
      '/',
    )
    resolver = ResolverFactory.createResolver({
      useSyncFileSystemCalls: true,
      fileSystem: fileSystem as any,
      plugins: [new MiniprogramResolverPlugin({ moduleToRelative: true })],
    })
  })

  test('should resolve', async () => {
    expect(resolver.resolveSync({}, '/', 'a')).toEqual('/a/index')
    expect(resolver.resolveSync({}, '/', 'a/index')).toEqual('/a/index')
    expect(resolver.resolveSync({}, '/', 'a/dir')).toEqual('/a/dir/index')
    expect(resolver.resolveSync({}, '/', 'a/dir/index')).toEqual('/a/dir/index')

    expect(resolver.resolveSync({}, '/b', 'index')).toEqual('/b/index')
    expect(resolver.resolveSync({}, '/b', 'dir')).toEqual('/b/dir/index')
    expect(resolver.resolveSync({}, '/b', 'dir/index')).toEqual('/b/dir/index')
  })

  test('should use node_modules first', async () => {
    expect(resolver.resolveSync({}, '/', 'c')).toEqual('/node_modules/c/index')
    expect(resolver.resolveSync({}, '/', 'c/index')).toEqual('/node_modules/c/index')
    expect(resolver.resolveSync({}, '/', 'c/dir')).toEqual('/node_modules/c/dir/index')
    expect(resolver.resolveSync({}, '/', 'c/dir/index')).toEqual('/node_modules/c/dir/index')
  })
})
