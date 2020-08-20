import { getOptions } from 'loader-utils'
import AssetDependency from '../AssetDependency'
import { asyncLoaderWrapper, evalModuleBundleCode, getModuleIdentifier } from '../utils'
import path from 'path'

export default asyncLoaderWrapper(async function (source) {
  const options = getOptions(this) || {}
  const { type, outputPath, outputDir } = options

  this.cacheable()

  switch (type) {
    case 'miniprogram/wxss': {
      const { exports: moduleContent, compilation } = await evalModuleBundleCode(this, source, this.request)
      moduleContent.exports.forEach(([moduleId, content, sourceMap]) => {
        const identifier = getModuleIdentifier(compilation, moduleId)
        this._module.addDependency(new AssetDependency(type, identifier, this.context, content, outputPath, sourceMap))
      })
      break
    }
    case 'miniprogram/json': {
      const identifier = this._module.identifier()
      this._module.addDependency(new AssetDependency(type, identifier, this.context, source, outputPath))
      break
    }
    case 'miniprogram/wxml': {
      const { exports: moduleContent, compilation } = await evalModuleBundleCode(this, source, this.request)
      moduleContent.exports.forEach(([moduleId, content, url, sourceMap]) => {
        const identifier = getModuleIdentifier(compilation, moduleId)
        this._module.addDependency(
          new AssetDependency(type, identifier, this.context, content, path.join(outputDir, url), sourceMap),
        )
      })
      break
    }
  }

  return `// asset ${this.request}`
})
