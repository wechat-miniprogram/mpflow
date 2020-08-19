/* eslint-env jest */
import compile from './helpers/compile'

describe('wxss-loader', () => {
  test('should work', async () => {
    const result = await compile('basic', {})
    expect(result.exports).toMatchSnapshot('exports')
    expect(result.warnings).toMatchSnapshot('warnings')
    expect(result.errors).toMatchSnapshot('errors')
  })

  test('should work with esModule', async () => {
    const result = await compile('basic', { esModule: true })
    expect(result.exports).toMatchSnapshot('exports')
    expect(result.warnings).toMatchSnapshot('warnings')
    expect(result.errors).toMatchSnapshot('errors')
  })

  test('should work with sourceMap', async () => {
    const result1 = await compile('basic', {}, true)
    expect(result1.exports).toMatchSnapshot('exports')
    expect(result1.warnings).toMatchSnapshot('warnings')
    expect(result1.errors).toMatchSnapshot('errors')

    const result2 = await compile('basic', { sourceMap: true })
    expect(result2.exports).toEqual(result1.exports)
    expect(result2.warnings).toEqual(result1.warnings)
    expect(result2.errors).toEqual(result1.errors)
  })

  test('should work with less', async () => {
    const result = await compile('less', {})
    expect(result.exports).toMatchSnapshot('exports')
    expect(result.warnings).toMatchSnapshot('warnings')
    expect(result.errors).toMatchSnapshot('errors')
  })
})
