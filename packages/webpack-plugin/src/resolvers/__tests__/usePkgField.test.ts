import { Volume } from 'memfs'
import { ResolverFactory } from 'enhanced-resolve'
import MiniprogramResolverPlugin from '../MiniprogramResolverPlugin'

describe('resolver usePkgField', () => {
  let resolver: ReturnType<typeof ResolverFactory.createResolver>

  beforeEach(() => {
    const fileSystem = Volume.fromJSON(
      {
        '/node_modules/a/mp_dist/index': '',
        '/node_modules/a/mp_dist/dir/index': '',
        '/node_modules/a/index': '',
        '/node_modules/a/dir/index': '',
        '/node_modules/a/package.json': '{"main":"index","miniprogram":"mp_dist"}',
        '/node_modules/b/miniprogram_dist/index': '',
        '/node_modules/b/miniprogram_dist/dir/index': '',
        '/node_modules/b/index': '',
        '/node_modules/b/dir/index': '',
        '/node_modules/b/package.json': '{"main":"index"}',
        '/node_modules/c/index': '',
        '/node_modules/c/dir/index': '',
        '/node_modules/c/package.json': '{"main":"index","miniprogram":"mp_dist"}',
      },
      '/',
    )
    resolver = ResolverFactory.createResolver({
      useSyncFileSystemCalls: true,
      fileSystem: fileSystem as any,
      plugins: [new MiniprogramResolverPlugin({ usePkgField: true })],
    })
  })

  test('should resolve', async () => {
    expect(resolver.resolveSync({}, '/', 'a')).toEqual('/node_modules/a/mp_dist/index')
    expect(resolver.resolveSync({}, '/', 'a/index')).toEqual('/node_modules/a/mp_dist/index')
    expect(resolver.resolveSync({}, '/', 'a/dir')).toEqual('/node_modules/a/mp_dist/dir/index')
    expect(resolver.resolveSync({}, '/', 'a/dir/index')).toEqual('/node_modules/a/mp_dist/dir/index')
  })

  test('should default to miniprogram_dist', async () => {
    expect(resolver.resolveSync({}, '/', 'b')).toEqual('/node_modules/b/miniprogram_dist/index')
    expect(resolver.resolveSync({}, '/', 'b/index')).toEqual('/node_modules/b/miniprogram_dist/index')
    expect(resolver.resolveSync({}, '/', 'b/dir')).toEqual('/node_modules/b/miniprogram_dist/dir/index')
    expect(resolver.resolveSync({}, '/', 'b/dir/index')).toEqual('/node_modules/b/miniprogram_dist/dir/index')
  })

  test('should fallback to normal resolve', async () => {
    expect(resolver.resolveSync({}, '/', 'c')).toEqual('/node_modules/c/index')
    expect(resolver.resolveSync({}, '/', 'c/index')).toEqual('/node_modules/c/index')
    expect(resolver.resolveSync({}, '/', 'c/dir')).toEqual('/node_modules/c/dir/index')
    expect(resolver.resolveSync({}, '/', 'c/dir/index')).toEqual('/node_modules/c/dir/index')
  })
})
