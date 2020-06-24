import AssetModule from './AssetModule'

class AssetModuleFactory {
  create({ dependencies: [dependency] }, callback) {
    return callback(
      null,
      new AssetModule(dependency.type, dependency.context, dependency.content, dependency.getResourceIdentifier()),
    )
  }
}

export default AssetModuleFactory
