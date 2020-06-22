import VirtualDependency from './VirtualDependency'

const PLUGIN_NAME = 'MpVirtualPlugin'

class MpVirtualPlugin {
  constructor(options) {
    this.options = options
  }

  apply(compiler) {
    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation, { normalModuleFactory }) => {
      compilation.dependencyFactories.set(VirtualDependency, normalModuleFactory)
    })
  }
}

export default MpVirtualPlugin
