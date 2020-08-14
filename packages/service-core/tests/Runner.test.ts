import path from 'path'

describe('Runner', () => {
  const { Runner: BaseRunner } = require('../src/Runner') as typeof import('../src/Runner')
  class Runner extends BaseRunner {}

  const context = path.resolve(__dirname, './fixtures/basic')

  test('should able to construct', () => {
    new Runner(context)
  })

  test('should register command', async () => {
    const runner = new Runner(context)
    const fooHandler = jest.fn()
    const barHandler = jest.fn()

    runner.registerCommand('foo', false, {}, {}, fooHandler)
    runner.registerCommand('bar', false, {}, {}, barHandler)

    expect(fooHandler).toBeCalledTimes(0)
    expect(barHandler).toBeCalledTimes(0)

    await runner.run(['foo', '123'])

    expect(fooHandler).toBeCalledTimes(1)
    expect(barHandler).toBeCalledTimes(0)

    await runner.run(['bar', '--dev'])

    expect(fooHandler).toBeCalledTimes(1)
    expect(barHandler).toBeCalledTimes(1)
  })
})
