import fs from 'fs'
import os from 'os'
import path from 'path'
import webpack, { Configuration } from 'webpack'
import { createFsFromVolume, Volume } from 'memfs'
import MpflowPlugin from '@mpflow/webpack-plugin'

async function buildRuntimeFixture(
  files: Record<string, string>,
  options: Partial<Configuration>,
  rebuildFiles?: Record<string, string>,
) {
  const context = fs.mkdtempSync(path.join(os.tmpdir(), 'mpflow-runtime-'))
  for (const [filename, source] of Object.entries(files)) fs.writeFileSync(path.join(context, filename), source)
  const outputPath = path.join(context, 'dist')
  const compiler = webpack({
    mode: 'development',
    context,
    target: false,
    devtool: false,
    output: { path: outputPath, filename: '_commons/[id].js', chunkFilename: '_commons/[id].js', publicPath: '' },
    plugins: [MpflowPlugin.target, new MpflowPlugin()],
    ...options,
  })
  const output = createFsFromVolume(new Volume())
  compiler.outputFileSystem = output
  try {
    const compile = async () => {
      const stats = await new Promise<webpack.Stats>((resolve, reject) => {
        compiler.run((error, result) => (error ? reject(error) : resolve(result!)))
      })
      expect(stats.compilation.errors).toEqual([])
      expect(stats.compilation.warnings).toEqual([])
      return Object.fromEntries(
        Object.keys(stats.compilation.assets).map(filename => [
          filename,
          output.readFileSync(path.join(outputPath, filename), 'utf8').toString(),
        ]),
      )
    }
    const firstAssets = await compile()
    let assets = firstAssets
    if (rebuildFiles) {
      for (const [filename, source] of Object.entries(rebuildFiles))
        fs.writeFileSync(path.join(context, filename), source)
      ;(compiler.inputFileSystem as any).purge()
      compiler.modifiedFiles = new Set(Object.keys(rebuildFiles).map(filename => path.join(context, filename)))
      assets = await compile()
    }
    const cache = new Map<string, { exports: any }>()
    const execute = (filename: string): any => {
      const cached = cache.get(filename)
      if (cached) return cached.exports
      if (!(filename in assets)) throw new Error(`Missing emitted JavaScript asset: ${filename}`)
      const module = { exports: {} }
      cache.set(filename, module)
      const load = (request: string) =>
        execute(path.posix.normalize(path.posix.join(path.posix.dirname(filename), request)))
      new Function('module', 'exports', 'require', assets[filename]).call(module.exports, module, module.exports, load)
      return module.exports
    }
    return { assets, firstAssets, execute }
  } finally {
    await new Promise<void>((resolve, reject) => compiler.close(error => (error ? reject(error) : resolve())))
    fs.rmSync(context, { recursive: true, force: true })
  }
}

describe('miniprogram webpack runtime', () => {
  test.each(['development', 'production'] as const)(
    'preserves shared caches and CommonJS entry exports in %s',
    async mode => {
      const { assets, execute } = await buildRuntimeFixture(
        {
          'a.js': 'module.exports = require("./common");',
          'b.js': 'module.exports = require("./common");',
          'common.js': 'module.exports = { token: {}, count: 0 };',
        },
        {
          mode,
          entry: {
            a: `${MpflowPlugin.libLoader}?outputPath=a!./a.js`,
            b: `${MpflowPlugin.libLoader}?outputPath=pages/b!./b.js`,
          },
          optimization: {
            moduleIds: 'natural',
            chunkIds: 'natural',
            runtimeChunk: 'single',
            splitChunks: {
              chunks: 'all',
              minSize: 0,
              cacheGroups: { common: { minChunks: 2, priority: -20, reuseExistingChunk: true } },
            },
          },
        },
      )
      const a = execute('a.js')
      a.count++
      const b = execute('pages/b.js')
      expect(b).toBe(a)
      expect(b.count).toBe(1)
      expect(Object.keys(assets).filter(filename => filename.startsWith('_commons/'))).toHaveLength(2)
    },
  )

  test('inlines webpack strict entry chunks without changing factory strict mode', async () => {
    const { execute } = await buildRuntimeFixture(
      { 'entry.js': '"use strict"; module.exports = { strictThis: (function() { return this; })() };' },
      {
        mode: 'production',
        entry: `${MpflowPlugin.libLoader}?outputPath=entry!./entry.js`,
        optimization: {
          runtimeChunk: 'single',
          splitChunks: { chunks: 'all', minSize: 0, cacheGroups: { all: { test: () => true, enforce: true } } },
        },
      },
    )
    expect(execute('entry.js')).toEqual({ strictThis: undefined })
  })

  test('does not wait for asset-only chunks before starting a JavaScript entry', async () => {
    const { assets, execute } = await buildRuntimeFixture(
      { 'app.js': 'module.exports = 42;', 'app.json': '{"pages": []}' },
      {
        entry: `${MpflowPlugin.appLoader}!./app.js`,
        module: {
          rules: [{ test: /\.json$/, type: 'javascript/auto', enforce: 'pre', loader: require.resolve('json-loader') }],
        },
        optimization: {
          runtimeChunk: 'single',
          splitChunks: {
            chunks: 'all',
            minSize: 0,
            cacheGroups: {
              assets: { test: module => module.type === 'miniprogram/json', enforce: true, name: 'assets' },
            },
          },
        },
      },
    )
    expect(Object.keys(assets)).toContain('app.json')
    expect(Object.keys(assets)).not.toContain('_commons/assets.js')
    expect(execute('app.js')).toBe(42)
  })

  test('updates virtual assets and JavaScript dependencies on a second run of the same compiler', async () => {
    const { assets, firstAssets, execute } = await buildRuntimeFixture(
      {
        'app.js': 'module.exports = require("./dependency");',
        'dependency.js': 'module.exports = 1;',
        'app.json': '{"pages": [], "window": {"navigationBarTitleText": "first"}}',
        'app.wxss': '.app { color: red; }',
      },
      {
        entry: `${MpflowPlugin.appLoader}!./app.js`,
        module: {
          rules: [
            { test: /\.json$/, type: 'javascript/auto', enforce: 'pre', loader: require.resolve('json-loader') },
            { test: /\.wxss$/, enforce: 'pre', loader: path.resolve(__dirname, '../../wxss-loader/lib/cjs.js') },
          ],
        },
      },
      {
        'dependency.js': 'module.exports = 2;',
        'app.json': '{"pages": [], "window": {"navigationBarTitleText": "second"}}',
        'app.wxss': '.app { color: blue; }',
      },
    )
    expect(firstAssets['app.wxss']).toContain('red')
    expect(assets['app.wxss']).toContain('blue')
    expect(JSON.parse(firstAssets['app.json']).window.navigationBarTitleText).toBe('first')
    expect(JSON.parse(assets['app.json']).window.navigationBarTitleText).toBe('second')
    expect(execute('app.js')).toBe(2)
  })

  test('loads an asynchronous chunk relative to an inlined nested entry', async () => {
    const { assets, execute } = await buildRuntimeFixture(
      {
        'entry.js': 'module.exports = { initial: 17, load: () => import("./async").then(m => m.default) };',
        'async.js': 'module.exports = { value: 23 };',
      },
      {
        entry: `${MpflowPlugin.libLoader}?outputPath=nested/index!./entry.js`,
        optimization: { moduleIds: 'natural', chunkIds: 'natural' },
      },
    )
    expect(Object.keys(assets).sort()).toEqual(['_commons/1.js', 'nested/index.js'])
    const entry = execute('nested/index.js')
    expect(entry.initial).toBe(17)
    const first = await entry.load()
    expect(first).toEqual({ value: 23 })
    expect(await entry.load()).toBe(first)
  })
})
