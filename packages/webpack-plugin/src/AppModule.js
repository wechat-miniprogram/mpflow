import Module from 'webpack/lib/Module'
import Template from 'webpack/lib/Template'
import MissingModule from 'webpack/lib/dependencies/WebpackMissingModule'
import { ConcatSource } from 'webpack-sources'

class AppModule extends Module {
  constructor(context, dependencies, request) {
    super('javascript/dynamic', context)

    // Info from Factory
    this.dependencies = dependencies
    this.request = request
  }

  identifier() {
    return `miniprogram app ${this.request}`
  }

  readableIdentifier(requestShortener) {
    return `miniprogram app ${requestShortener.shorten(this.request)}`
  }

  build(options, compilation, resolver, fs, callback) {
    this.built = true
    this.buildMeta = {}
    this.buildInfo = {}
    return callback()
  }

  needRebuild() {
    return false
  }

  size() {
    return 16 + this.dependencies.length * 12
  }

  /**
   * @param {Hash} hash the hash used to track dependencies
   * @returns {void}
   */
  updateHash(hash) {
    hash.update('miniprogram app')
    hash.update(this.request)
    super.updateHash(hash)
  }

  source(dependencyTemplates, runtimeTemplate) {
    const source = new ConcatSource()
    let idx = 0
    for (const dep of this.dependencies) {
      if (dep.module) {
        if (idx === this.dependencies.length - 1) {
          source.add('module.exports = ')
        }
        source.add('__webpack_require__(')
        if (runtimeTemplate.outputOptions.pathinfo) {
          source.add(Template.toComment(dep.request))
        }
        source.add(`${JSON.stringify(dep.module.id)}`)
        source.add(')')
      } else {
        const content = MissingModule.module(dep.request)
        source.add(content)
      }
      source.add(';\n')
      idx++
    }
    return source
  }
}

export default AppModule
