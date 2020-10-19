/* eslint-env jest */
import compile from './helpers/compile'

describe('wxml-loader', () => {
  test('should work', async () => {
    const result = await compile('basic', {})
    expect(result.exports).toMatchSnapshot('exports')
    expect(result.warnings).toMatchSnapshot('warnings')
    expect(result.errors).toMatchSnapshot('errors')
  })

  test('work with esModule', async () => {
    const result = await compile('basic', { esModule: true })
    expect(result.exports).toMatchSnapshot('exports')
    expect(result.warnings).toMatchSnapshot('warnings')
    expect(result.errors).toMatchSnapshot('errors')
  })

  test('work with minimize', async () => {
    const result = await compile('basic', { minimize: true })
    expect(result.exports).toMatchSnapshot('exports')
    expect(result.warnings).toMatchSnapshot('warnings')
    expect(result.errors).toMatchSnapshot('errors')
  })

  test('work with mustache disabled', async () => {
    const result = await compile('mustache', { minimize: true })
    expect(result.exports).toMatchSnapshot('exports')
    expect(result.warnings).toMatchSnapshot('warnings')
    expect(result.errors).toMatchSnapshot('errors')
  })

  test('work with mustache enabled', async () => {
    const result = await compile('mustache', { minimize: true, resolveMustache: true })
    expect(result.exports).toMatchSnapshot('exports')
    expect(result.warnings).toMatchSnapshot('warnings')
    expect(result.errors).toMatchSnapshot('errors')
  })
})
