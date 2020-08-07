import expectToMatchExampleDist from './helpers/expectToMatchExampleDist'
import runExample from './helpers/runExample'

describe('webpack-plugin examples', () => {
  test('app', async () => {
    const result = await runExample('app')
    expect(result.errors).toMatchSnapshot('errors')
    expect(result.warnings).toMatchSnapshot('warnings')
    await expectToMatchExampleDist(result.assets, 'app')
  })

  test('plugin', async () => {
    const result = await runExample('plugin')
    expect(result.errors).toMatchSnapshot('errors')
    expect(result.warnings).toMatchSnapshot('warnings')
    await expectToMatchExampleDist(result.assets, 'plugin')
  })
})
