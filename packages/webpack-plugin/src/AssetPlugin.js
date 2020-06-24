import AssetDependency from './AssetDependency'
import AssetModuleFactory from './AssetModuleFactory'
import AssetModule from './AssetModule'
import { RawSource } from 'webpack-sources'

const PLUGIN_NAME = 'MpAssetPlugin'

function getExt(type) {
  switch (type) {
    case 'miniprogram/json':
      return '.json'
    case 'miniprogram/wxml':
      return '.wxml'
    case 'miniprogram/wxss':
      return '.wxss'
    case 'miniprogram/wxs':
      return '.wxs'
  }
  return ''
}

class MpAssetPlugin {
  constructor(options) {
    this.options = options
  }

  apply(compiler) {
    compiler.hooks.compilation.tap(PLUGIN_NAME, compilation => {
      compilation.dependencyFactories.set(AssetDependency, new AssetModuleFactory())

      compilation.dependencyTemplates.set(AssetDependency, new AssetDependency.Template())

      compilation.mainTemplate.hooks.renderManifest.tap(PLUGIN_NAME, (result, { chunk }) => {
        for (const module of chunk.modulesIterable) {
          if (module instanceof AssetModule) {
            result.push({
              render: () => new RawSource(module.content),
              pathOptions: { chunk },
              filenameTemplate: `[name]${getExt(module.type)}`,
              identifier: `${PLUGIN_NAME}.${module.id}`,
              hash: module.hash,
            })
          }
        }

        return result
      })
    })
  }
}

export default MpAssetPlugin
