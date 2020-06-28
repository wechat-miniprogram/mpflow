import Module from 'webpack/lib/Module'

class AssetModule extends Module {
  constructor(type, context, content, identifier, outputPath) {
    super(type, context)

    this.content = content
    this._identifier = identifier
    this.outputPath = outputPath
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
    this.content = module.content
  }

  needRebuild() {
    return true
  }

  build(options, compilation, resolver, fileSystem, callback) {
    this.buildInfo = {}
    this.buildMeta = {}
    callback()
  }

  updateHash(hash) {
    super.updateHash(hash)

    hash.update(this.content)
  }
}

export default AssetModule
