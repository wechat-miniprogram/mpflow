import AssetModule from './AssetModule'
import ConfigDependency from './ConfigDependency'

class AssetModuleFactory {
  create({ dependencies: [dependency] }, callback) {
    if (dependency instanceof ConfigDependency) {
      return callback(
        null,
        new AssetModule('miniprogram/json', dependency.context, dependency.content, dependency.getResourceIdentifier()),
      )
    }
    callback()
  }
}

export default AssetModuleFactory
