import PageDependency from './PageDependency'
import PageModuleFactory from './PageModuleFactory'

const PLUGIN_NAME = 'MpPagePlugin'

class MpPagePlugin {
  constructor(options) {
    this.options = options
  }

  apply(compiler) {
    compiler.hooks.compilation.tap(PLUGIN_NAME, compilation => {
      compilation.dependencyFactories.set(PageDependency, new PageModuleFactory(compiler.resolverFactory))

      compilation.dependencyTemplates.set(PageDependency, new PageDependency.Template())
    })
  }
}

export default MpPagePlugin
