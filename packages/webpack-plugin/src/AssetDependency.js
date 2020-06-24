import ModuleDependency from 'webpack/lib/dependencies/ModuleDependency'

class AssetDependency extends ModuleDependency {
  constructor(type, request, context, content) {
    super(request)
    this.type = type
    this.context = context
    this.content = content
  }

  getResourceIdentifier() {
    return `mp-asset-module-${this.request}`
  }
}

class AssetDependencyTemplate {
  apply() {
    // do nothing
  }
}
AssetDependency.Template = AssetDependencyTemplate

export default AssetDependency
