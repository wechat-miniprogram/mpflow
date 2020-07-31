import VirtualDependency from './VirtualDependency'
import VirtualModule from './VirtualModule'

const PLUGIN_NAME = 'Weflow Virtual Plugin'

class VirtualPlugin {
  constructor(options) {
    this.options = options
  }

  apply(compiler) {
    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation, { normalModuleFactory }) => {
      compilation.dependencyFactories.set(VirtualDependency, normalModuleFactory)
      compilation.dependencyTemplates.set(VirtualDependency, new VirtualDependency.Template())

      normalModuleFactory.hooks.createModule.tap(PLUGIN_NAME, createOptions => {
        const {
          dependencies: [dependency],
        } = createOptions
        if (dependency instanceof VirtualDependency) return new VirtualModule(createOptions)
      })
    })
  }
}
export default VirtualPlugin
