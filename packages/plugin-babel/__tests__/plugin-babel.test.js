import { ServiceRunner } from '@mpflow/service'
import webpack from 'webpack'
import pluginBabel from '../src'

describe('plugin-babel', () => {
  test('registers the Babel loader in a valid webpack 5 configuration', async () => {
    const runner = new ServiceRunner(__dirname, {
      config: { app: 'app', sourceMap: false },
      plugins: [{ id: '@mpflow/plugin-babel', module: pluginBabel }],
    })
    await runner.init()
    const { app } = await runner.resolveWebpackConfigs()

    expect(() => webpack.validate(app)).not.toThrow()
    expect(app.resolve.alias['regenerator-runtime']).toBe(require.resolve('regenerator-runtime'))
    const rule = app.module.rules.find(rule => rule.test.test('app.tsx.jsx'))
    expect(rule.enforce).toBe('pre')
    expect(rule.exclude).toEqual([/node_modules/])
    expect(rule.use).toEqual([
      {
        loader: require.resolve('babel-loader'),
        options: { cacheDirectory: true, rootMode: 'upward-optional' },
      },
    ])
  })
})
