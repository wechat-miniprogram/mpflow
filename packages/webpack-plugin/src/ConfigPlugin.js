import ConfigDependency from './ConfigDependency'
import AssetModuleFactory from './AssetModuleFactory'
import AssetModule from './AssetModule'
import { RawSource } from 'webpack-sources'

const PLUGIN_NAME = 'MpConfigPlugin'

class MpConfigPlugin {
  constructor(options) {
    this.options = options
  }

  apply(compiler) {
    compiler.hooks.compilation.tap(PLUGIN_NAME, compilation => {
      compilation.dependencyFactories.set(ConfigDependency, new AssetModuleFactory())

      compilation.dependencyTemplates.set(ConfigDependency, new ConfigDependency.Template())

      compilation.mainTemplate.hooks.renderManifest.tap(PLUGIN_NAME, (result, { chunk }) => {
        for (const module of chunk.modulesIterable) {
          if (module instanceof AssetModule && module.type === 'miniprogram/json') {
            result.push({
              render: () => new RawSource(module.content),
              pathOptions: { chunk },
              filenameTemplate: '[name].json',
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

export default MpConfigPlugin
