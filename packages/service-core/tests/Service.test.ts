import path from 'path'

describe('Service', () => {
  const { BaseService } = require('../src/Service') as typeof import('../src/Service')
  class Service extends BaseService {}

  const context = path.resolve(__dirname, './fixtures/basic')

  test('should able to construct', () => {
    new Service(context)
  })

  test('should read pkg', () => {
    const service = new Service(context)
    expect(service.pkg).toEqual({ name: 'test-basic' })
  })

  test('should read config', () => {
    const service = new Service(context)
    expect(service.config).toEqual({ plugins: ['test-plugin'] })
  })

  test('should resolvePluginInfos', () => {
    const service = new Service(context)
    expect(service.pluginOptions).toEqual([{ id: 'test-plugin' }])
  })

  test('should resolvePlugins', () => {
    const service = new Service(context)
    expect(service.resolvePlugins()).toEqual([{ config: undefined, id: 'test-plugin', plugin: expect.any(Function) }])
  })
})
