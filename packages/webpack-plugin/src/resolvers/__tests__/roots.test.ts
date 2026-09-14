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
        '/virtualRoot/aliased/index': '',
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
      alias: { '/aliased': '/b' },
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

  test('should resolve aliases before miniprogram roots', () => {
    expect(resolver.resolveSync({}, '/', '/aliased')).toEqual('/b/index')
  })

  test('should track the resolved file and missing root candidates for watch rebuilds', async () => {
    const resolveContext = {
      fileDependencies: new Set<string>(),
      missingDependencies: new Set<string>(),
      contextDependencies: new Set<string>(),
    }

    const result = await new Promise<string | false | undefined>((resolve, reject) => {
      resolver.resolve({}, '/', '/b', resolveContext, (error, result) => {
        if (error) reject(error)
        else resolve(result)
      })
    })

    expect(result).toEqual('/b/index')
    expect(resolveContext.fileDependencies.has('/b/index')).toBe(true)
    expect(resolveContext.missingDependencies.has('/virtualRoot/b')).toBe(true)
  })
})
