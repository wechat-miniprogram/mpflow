import { execFileSync } from 'child_process'
import path from 'path'
import { ServiceRunner } from '@mpflow/service'
import ImageMinimizerPlugin from 'image-minimizer-webpack-plugin'
import pluginSlim from '../src'

describe('plugin-slim image minimization', () => {
  test('preserves the four format switches and existing compressor parameters', async () => {
    const runner = new ServiceRunner(__dirname, {
      config: { app: 'app', sourceMap: false },
      plugins: [
        {
          id: '@mpflow/plugin-slim',
          module: pluginSlim,
          option: {
            imagemin: { jpg: { progressive: false }, gif: {}, png: true, svg: { plugins: [{ removeViewBox: true }] } },
          },
        },
      ],
    })
    await runner.init()
    const { app } = await runner.resolveWebpackConfigs()
    for (const [format, compressor, options] of [
      ['jpg', 'imagemin-jpegtran', { progressive: true }],
      ['gif', 'imagemin-gifsicle', { interlaced: true }],
      ['png', 'imagemin-optipng', { optimizationLevel: 5 }],
      ['svg', 'imagemin-svgo', { plugins: [{ removeViewBox: false }] }],
    ]) {
      const loader = app.module.rules.find(
        rule => rule.use?.some(use => use.loader === ImageMinimizerPlugin.loader) && rule.test.test(`image.${format}`),
      ).use[0]
      expect(loader.options).not.toHaveProperty('cache')
      expect(typeof loader.options.minimizer.implementation).toBe('function')
      expect(loader.options.minimizer.options).toEqual({ plugins: [[require.resolve(compressor), options]] })
    }
  })

  test.each(['failure-bail', 'normalization-bail'])(
    'honors bail for %s configured after plugin initialization',
    kind => {
      const output = execFileSync(process.execPath, [path.join(__dirname, 'compile-image.cjs'), kind], {
        encoding: 'utf8',
      })
      expect(JSON.parse(output.trim())).toEqual({ kind, preservesBail: true })
    },
  )

  test.each([
    'format',
    'custom-string',
    'custom-tuple',
    'custom-function',
    'combined',
    'failure',
    'combined-failure',
    'format-failure',
    'normalization',
  ])('compiles real SVG bytes with %s configuration', kind => {
    const output = execFileSync(process.execPath, [path.join(__dirname, 'compile-image.cjs'), kind], {
      encoding: 'utf8',
    })
    expect(JSON.parse(output.trim())).toMatchObject({ kind, matchesEngineBytes: true })
  })
})
