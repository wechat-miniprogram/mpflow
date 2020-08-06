/* eslint-env jest */
import compile from './helpers/compile'

describe('wxss-loader', () => {
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
})
