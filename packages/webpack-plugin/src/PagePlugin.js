import PageDependency from './PageDependency'
import PageModuleFactory from './PageModuleFactory'

const PLUGIN_NAME = 'MpPagePlugin'

class MpPagePlugin {
  constructor(options) {
    this.options = options
  }

  apply(compiler) {
    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation, { normalModuleFactory }) => {
      compilation.dependencyFactories.set(PageDependency, normalModuleFactory)

      compilation.dependencyTemplates.set(PageDependency, new PageDependency.Template())

      normalModuleFactory.hooks.beforeResolve.tap(PLUGIN_NAME, result => {
        const [dependency] = result.dependencies

        if (dependency instanceof PageDependency) {
          const resolveOptions = compiler.resolverFactory.hooks.resolveOptions
            .for('miniprogram/page')
            .call(result.resolveOptions)
          return {
            ...result,
            resolveOptions,
          }
        }

        return result
      })
    })
  }
}

export default MpPagePlugin
