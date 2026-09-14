import AssetModule from './AssetModule'

class AssetModuleFactory {
  create({ dependencies: [dependency] }, callback) {
    return callback(null, {
      module: new AssetModule(
        dependency.type,
        dependency.context,
        dependency.content,
        dependency.getResourceIdentifier(),
        dependency.outputPath,
        dependency.sourceMap,
      ),
    })
  }
}

export default AssetModuleFactory
