import JoinRequestPlugin from 'enhanced-resolve/lib/JoinRequestPlugin'
import TryNextPlugin from 'enhanced-resolve/lib/TryNextPlugin'
import ModuleFieldDirPlugin from './ModuleFieldDirPlugin'
import RootsPlugin from './RootsPlugin'

export default class MiniprogramResolverPlugin {
  /**
   *
   * @param {object} options
   * @param {boolean} [options.moduleToRelative] 当使用模块路径无法找到时，作为相对路径查找
   * @param {string[]} [options.roots] 作为小程序的根路径
   * @param {boolean} [options.usePkgField] 当无法找到对应文件时，尝试通过 package.json 中定义的 miniprogram 字段作为路径查找
   */
  constructor(options) {
    this.options = options
  }

  apply(resolver) {
    const { moduleToRelative, roots, usePkgField } = this.options

    const plugins = []

    if (moduleToRelative) {
      // 当作为模块查找时无法找到时，fallback 到相对路径查找
      plugins.push(
        // resolve('webpack') => resolve('./webpack')
        new TryNextPlugin('after-raw-module', 'fallback as relative', 'fallback-relative'),
        // fallback 到 relative
        new JoinRequestPlugin('fallback-relative', 'relative'),
      )
    }

    if (roots && roots.length) {
      // 当作为绝对路径查找无法找到时，作为小程序的绝对路径处理
      plugins.push(
        new RootsPlugin('after-described-resolve', new Set(roots), 'relative'),

        // new AbsoluteKindPlugin('after-after-described-resolve', 'miniprogram-absolute'),
        // // 向上路径查找 project.config.json, 用其中 miniprogramRoot 作为根路径
        // new ProjectConfigFileRootPlugin('miniprogram-absolute', 'project.config.json', 'miniprogramRoot', 'resolve'),
      )
    }

    if (usePkgField) {
      // 优先尝试通过 package.json 中定义的 miniprogram 字段作为路径查找
      plugins.push(
        // resolve('weui-miniprogram/cell/cell') => resolve('weui-miniprogram/miniprogram_dist/cell/cell')
        new ModuleFieldDirPlugin('before-described-relative', 'miniprogram', 'miniprogram_dist', 'resolve'),
      )
    }

    plugins.forEach(plugin => plugin.apply(resolver))
  }
}
