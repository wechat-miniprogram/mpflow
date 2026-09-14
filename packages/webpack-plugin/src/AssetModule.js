import Module from 'webpack/lib/Module'

class AssetModule extends Module {
  constructor(type, context, content, identifier, outputPath, sourceMap) {
    super(type, context)

    this.content = content
    this._identifier = identifier
    this.outputPath = outputPath
    this.sourceMap = sourceMap
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

  updateCacheModule(module) {
    super.updateCacheModule(module)
    this.content = module.content
    this.outputPath = module.outputPath
    this.sourceMap = module.sourceMap
  }

  needBuild(context, callback) {
    callback(null, true)
  }

  getSourceTypes() {
    return new Set([this.type])
  }

  codeGeneration() {
    return { sources: new Map(), runtimeRequirements: new Set() }
  }

  build(options, compilation, resolver, fileSystem, callback) {
    this.buildInfo = {}
    this.buildMeta = {}
    callback()
  }

  updateHash(hash) {
    // super.updateHash(hash)

    hash.update(this.content)
  }
}

export default AssetModule
