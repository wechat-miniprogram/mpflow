import SingleEntryDependency from 'webpack/lib/dependencies/SingleEntryDependency'
import AppModuleFactory from './AppModuleFactory'

const PLUGIN_NAME = 'MpAppPlugin'

class MpAppPlugin {
  constructor(options) {
    this.options = options
  }

  apply(compiler) {
    const { entry } = this.options

    let normalModuleFactory

    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation, params) => {
      normalModuleFactory = params.normalModuleFactory
    })

    // 注册 make 而不是 compilation 用于保证在 SingleEntryPlugin 之后覆盖
    compiler.hooks.make.tap(PLUGIN_NAME, compilation => {
      // 覆盖掉默认的 entry 模块生成
      compilation.dependencyFactories.set(
        SingleEntryDependency,
        new AppModuleFactory(entry, compiler.resolverFactory, normalModuleFactory),
      )
    })
  }
}

export default MpAppPlugin
