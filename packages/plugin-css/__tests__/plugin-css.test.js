import { ServiceRunner } from '@mpflow/service'
import fs from 'fs'
import os from 'os'
import path from 'path'
import postcss from 'postcss'
import webpack from 'webpack'
import pluginCss from '../src'

async function compileStyles(extension, main, imported, sourceMap = false) {
  const context = fs.mkdtempSync(path.join(os.tmpdir(), 'mpflow-css-'))
  fs.writeFileSync(path.join(context, 'app.js'), 'App({});')
  fs.writeFileSync(path.join(context, 'app.json'), '{"pages":[]}')
  fs.writeFileSync(path.join(context, `app.${extension}`), main)
  fs.mkdirSync(path.join(context, 'theme'))
  fs.writeFileSync(path.join(context, 'theme', `shared.${extension === 'stylus' ? 'styl' : extension}`), imported)

  let compiler
  try {
    const runner = new ServiceRunner(context, {
      config: {
        app: 'app',
        sourceMap,
        minimize: false,
        _clean: false,
        configureWebpackChain(config) {
          config.plugins.delete('progress')
          config.plugins.delete('pretty')
          config.resolve.alias.set('theme', path.join(context, 'theme'))
          const preprocessor = {
            less: ['less-loader', 'less'],
            scss: ['sass-loader', 'sass'],
            sass: ['sass-loader', 'sass'],
            stylus: ['stylus-loader', 'stylus'],
            styl: ['stylus-loader', 'stylus'],
          }[extension]
          if (preprocessor) {
            const [loader, implementation] = preprocessor
            // The loaders default to dynamic import; use the same peer implementation in Jest's CommonJS VM.
            config.module
              .rule(extension)
              .use(loader)
              .tap(options => ({
                ...options,
                implementation: require(require.resolve(implementation, { paths: [require.resolve(loader)] })),
              }))
          }
        },
      },
      plugins: [{ id: '@mpflow/plugin-css', module: pluginCss }],
    })
    await runner.init()
    const serviceWebpack = require(require.resolve('webpack', {
      paths: [path.dirname(require.resolve('@mpflow/service/package.json'))],
    }))
    compiler = serviceWebpack(Object.values(await runner.resolveWebpackConfigs()))
    const stats = await new Promise((resolve, reject) => {
      compiler.run((error, stats) => (error ? reject(error) : resolve(stats)))
    })
    if (stats.hasErrors()) throw new Error(stats.toString('errors-only'))
    const css = fs.readFileSync(path.join(context, 'dist/app.wxss'), 'utf8')
    const map = sourceMap ? JSON.parse(fs.readFileSync(path.join(context, 'dist/app.wxss.map'), 'utf8')) : undefined
    return { css, map }
  } finally {
    if (compiler) await new Promise((resolve, reject) => compiler.close(error => (error ? reject(error) : resolve())))
    fs.rmSync(context, { recursive: true, force: true })
  }
}

describe('plugin-css', () => {
  test('preserves the style preprocessing order with webpack 5', async () => {
    const runner = new ServiceRunner(__dirname, {
      config: { app: 'app', sourceMap: false },
      plugins: [{ id: '@mpflow/plugin-css', module: pluginCss }],
    })
    await runner.init()
    const { app } = await runner.resolveWebpackConfigs()

    expect(() => webpack.validate(app)).not.toThrow()
    for (const [extension, loader] of [
      ['css', undefined],
      ['less', 'less-loader'],
      ['sass', 'sass-loader'],
      ['scss', 'sass-loader'],
      ['stylus', 'stylus-loader'],
      ['styl', 'stylus-loader'],
    ]) {
      const rule = app.module.rules.find(rule => rule.test.test('app.' + extension))
      expect(rule.enforce).toBe('pre')
      expect(rule.use.map(use => use.loader)).toEqual([
        require.resolve('@mpflow/wxss-loader'),
        require.resolve('postcss-loader'),
        ...(loader ? [require.resolve(loader)] : []),
      ])
    }
  })

  test.each([
    ['css', '@import "./theme/shared.css"; .target { padding: 4px; }', '.imported { width: 3px; }'],
    [
      'less',
      '@import "theme/shared.less"; @gap: 4px; .target { padding: @gap; }',
      '@width: 3px; .imported { width: @width; }',
    ],
    ['scss', '@use "theme/shared"; $gap: 4px; .target { padding: $gap; }', '$width: 3px; .imported { width: $width; }'],
    ['sass', '@use "theme/shared"\n$gap: 4px\n.target\n  padding: $gap', '$width: 3px\n.imported\n  width: $width'],
    ['stylus', '@import "theme/shared.styl"\ngap = 4px\n.target\n  padding gap', 'wide = 3px\n.imported\n  width wide'],
    ['styl', '@import "theme/shared.styl"\ngap = 4px\n.target\n  padding gap', 'wide = 3px\n.imported\n  width wide'],
  ])('compiles .%s imports and preprocessing into WXSS', async (extension, main, imported) => {
    const { css } = await compileStyles(extension, main, imported)
    const declarations = []
    postcss.parse(css).walkDecls(declaration => {
      declarations.push([declaration.parent.selector, declaration.prop, declaration.value])
    })
    expect(declarations).toEqual([
      ['.imported', 'width', '3px'],
      ['.target', 'padding', '4px'],
    ])
  })

  test('keeps imported Less sources in the emitted source map', async () => {
    const { css, map } = await compileStyles(
      'less',
      '@import "theme/shared.less"; .target { padding: 4px; }',
      '.imported { width: 3px; }',
      true,
    )
    expect(css).toContain('sourceMappingURL=app.wxss.map')
    expect(map.sources.some(source => source.endsWith('/app.less'))).toBe(true)
    expect(map.sources.some(source => source.endsWith('/theme/shared.less'))).toBe(true)
    expect(map.sourcesContent).toContain('.imported { width: 3px; }')
  })
})
