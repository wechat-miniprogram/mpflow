import Dependency from 'webpack/lib/Dependency'

class AssetDependency extends Dependency {
  constructor(type, identifier, context, content, outputPath) {
    super()
    this.type = type
    this.identifier = identifier
    this.context = context
    this.content = content
    this.outputPath = outputPath
  }

  getResourceIdentifier() {
    return `mp-asset-module-${this.identifier}`
  }
}

class AssetDependencyTemplate {
  apply() {
    // do nothing
  }
}
AssetDependency.Template = AssetDependencyTemplate

export default AssetDependency
