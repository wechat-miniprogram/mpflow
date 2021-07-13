const PLUGIN_NAME = 'Mpflow Runtime Modules Plugin'

/**
 * RuntimeModulesPlugin 将运行时模块（如useExtendedLib里的模块）配置下发至 loader。
 */
class RuntimeModulesPlugin {
  constructor(options = {}) {
    this.externals = options.externals || []
  }

  apply(compiler) {
    const externals = this.externals
    compiler.hooks.compilation.tap(PLUGIN_NAME, compilation => {
      compilation.hooks.normalModuleLoader.tap(PLUGIN_NAME, context => {
        context.__mpflowIsExternalModule = request => {
          for (const external of externals) {
            if (external instanceof RegExp) {
              if (external.test(request)) return true
            } else if (typeof external === 'function') {
              if (external(request)) return true
            }
          }
          return false
        }
      })
    })
  }
}

export default RuntimeModulesPlugin
