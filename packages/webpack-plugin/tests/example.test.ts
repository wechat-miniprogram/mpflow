import expectToMatchExampleDist from './helpers/expectToMatchExampleDist'
import runExample from './helpers/runExample'

describe('webpack-plugin examples', () => {
  test('app', async () => {
    const result = await runExample('app')
    expect(result.errors).toMatchSnapshot('errors')
    expect(result.warnings).toMatchSnapshot('warnings')
    await expectToMatchExampleDist(result.assets, 'app')
  })

  test('image', async () => {
    const result = await runExample('image')
    expect(result.errors).toMatchSnapshot('errors')
    expect(result.warnings).toMatchSnapshot('warnings')
    await expectToMatchExampleDist(result.assets, 'image')
  })

  test('plugin', async () => {
    const result = await runExample('plugin')
    expect(result.errors).toMatchSnapshot('errors')
    expect(result.warnings).toMatchSnapshot('warnings')
    await expectToMatchExampleDist(result.assets, 'plugin')
  })

  test('sourceMap', async () => {
    const result = await runExample('sourceMap')
    expect(result.errors).toMatchSnapshot('errors')
    expect(result.warnings).toMatchSnapshot('warnings')
    await expectToMatchExampleDist(result.assets, 'sourceMap')
  })

  test('splitChunk', async () => {
    const result = await runExample('splitChunk')
    expect(result.errors).toMatchSnapshot('errors')
    expect(result.warnings).toMatchSnapshot('warnings')
    await expectToMatchExampleDist(result.assets, 'splitChunk')
  })
})
