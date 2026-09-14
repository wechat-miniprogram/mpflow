import { ServiceRunner } from '@mpflow/service'
import webpack from 'webpack'
import pluginBabel from '@mpflow/plugin-babel'
import pluginTypescript from '../src'

describe('plugin-typescript', () => {
  test('requires the Babel plugin', async () => {
    const runner = new ServiceRunner(__dirname, {
      config: { app: 'app', sourceMap: false },
      plugins: [{ id: '@mpflow/plugin-typescript', module: pluginTypescript }],
    })

    await expect(runner.init()).rejects.toThrow('@mpflow/plugin-typescript 需要安装 @mpflow/plugin-babel')
  })

  test('reuses Babel options and registers webpack 5 type checking', async () => {
    const runner = new ServiceRunner(__dirname, {
      config: { app: 'app', sourceMap: false },
      plugins: [
        { id: '@mpflow/plugin-babel', module: pluginBabel },
        { id: '@mpflow/plugin-typescript', module: pluginTypescript },
      ],
    })
    await runner.init()
    const { app } = await runner.resolveWebpackConfigs()

    expect(() => webpack.validate(app)).not.toThrow()
    expect(app.resolve.extensions.slice(0, 2)).toEqual(['.tsx', '.ts'])
    const jsRule = app.module.rules.find(rule => rule.test.test('app.js'))
    const tsRule = app.module.rules.find(rule => rule.test.test('app.ts'))
    expect(tsRule.use).toEqual(jsRule.use)
    expect(tsRule.exclude).toEqual(jsRule.exclude)
    expect(app.plugins.some(plugin => plugin.constructor.name === 'ForkTsCheckerWebpackPlugin')).toBe(true)
  })
})
