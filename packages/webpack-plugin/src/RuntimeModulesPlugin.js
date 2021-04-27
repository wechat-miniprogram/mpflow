const PLUGIN_NAME = 'Mpflow Runtime Modules Plugin'

/**
 * RuntimeModulesPlugin 将运行时模块（如useExtendedLib里的模块）配置下发至 loader。
 */
class RuntimeModulesPlugin {
  constructor(options = {}) {
    this.runtimeModules = []
    // weui
    if (options && options.useExtendedLib && options.useExtendedLib.weui) {
      this.runtimeModules = this.runtimeModules.concat([
        'weui-miniprogram/form/form',
        'weui-miniprogram/form-page/form-page',
        'weui-miniprogram/cell/cell',
        'weui-miniprogram/cells/cells',
        'weui-miniprogram/checkbox/checkbox',
        'weui-miniprogram/checkbox-group/checkbox-group',
        'weui-miniprogram/slideview/slideview',
        'weui-miniprogram/uploader/uploader',
        'weui-miniprogram/dialog/dialog',
        'weui-miniprogram/msg/msg',
        'weui-miniprogram/toptips/toptips',
        'weui-miniprogram/half-screen-dialog/half-screen-dialog',
        'weui-miniprogram/actionsheet/actionsheet',
        'weui-miniprogram/navigation-bar/navigation-bar',
        'weui-miniprogram/tabbar/tabbar',
        'weui-miniprogram/searchbar/searchbar',
        'weui-miniprogram/badge/badge',
        'weui-miniprogram/gallery/gallery',
        'weui-miniprogram/loading/loading',
        'weui-miniprogram/icon/icon',
        'weui-miniprogram/grids/grids',
      ])
    }
  }

  apply(compiler) {
    const runtimeModules = this.runtimeModules
    compiler.hooks.compilation.tap(PLUGIN_NAME, compilation => {
      compilation.hooks.normalModuleLoader.tap(PLUGIN_NAME, context => {
        context.__mpflowRuntimeModules = runtimeModules
      })
    })
  }
}

export default RuntimeModulesPlugin
