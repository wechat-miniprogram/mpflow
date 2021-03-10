import webpack from 'webpack'

class AssetModule extends webpack.Module {
  constructor(type, context, content, identifier, outputPath, sourceMap) {
    super(type, context)

    this.content = content
    this._identifier = identifier
    this.outputPath = outputPath
    this.sourceMap = sourceMap
    this.buildInfo = {}
  }

  size() {
    return this.content.length
  }

  identifier() {
    return `${this.type} ${this._identifier}`
  }

  readableIdentifier(requestShortener) {
    return `${this.type} ${requestShortener.shorten(this._identifier)}`
  }

  getSourceTypes() {
    return new Set([this.type])
  }

  codeGeneration() {
    return {
      sources: new Map(),
      runtimeRequirements: new Set(),
    }
  }

  updateCacheModule(module) {
    this.content = module.content
  }

  needRebuild() {
    return true
  }

  needBuild(context, callback) {
    callback(null, false)
  }

  build(options, compilation, resolver, fileSystem, callback) {
    this.buildInfo = {}
    this.buildMeta = {}
    callback()
  }

  serialize(context) {
    const { write } = context

    write(this.content)
    write(this._identifier)
    write(this.outputPath)
    write(this.sourceMap)

    super.serialize(context)
  }

  deserialize(context) {
    const { read } = context

    this.content = read()
    this._identifier = read()
    this.outputPath = read()
    this.sourceMap = read()

    super.deserialize(context)
  }
}

webpack.util.serialization.register(AssetModule, '@mpflow/webpack-plugin/lib/AssetModule')

export default AssetModule
