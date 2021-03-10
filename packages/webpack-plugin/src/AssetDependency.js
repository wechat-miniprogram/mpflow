import webpack from 'webpack'

class AssetDependency extends webpack.Dependency {
  constructor(type, identifier, context, content, outputPath, sourceMap) {
    super()
    this.mpType = type
    this.identifier = identifier
    this.context = context
    this.content = content
    this.outputPath = outputPath
    this.sourceMap = sourceMap
  }

  get type() {
    return this.mpType
  }

  getResourceIdentifier() {
    return `mp-asset-module-${this.identifier}`
  }

  getModuleEvaluationSideEffectsState() {
    return webpack.ModuleGraphConnection.TRANSITIVE_ONLY
  }

  serialize(context) {
    const { write } = context

    write(this.mpType)
    write(this.identifier)
    write(this.context)
    write(this.content)
    write(this.outputPath)
    write(this.sourceMap)

    super.serialize(context)
  }

  deserialize(context) {
    const { read } = context

    this.mpType = read()
    this.identifier = read()
    this.context = read()
    this.content = read()
    this.outputPath = read()
    this.sourceMap = read()

    super.deserialize(context)
  }
}

webpack.util.serialization.register(AssetDependency, '@mpflow/webpack-plugin/lib/AssetDependency')

class AssetDependencyTemplate {
  apply() {
    // do nothing
  }
}
AssetDependency.Template = AssetDependencyTemplate

export default AssetDependency
