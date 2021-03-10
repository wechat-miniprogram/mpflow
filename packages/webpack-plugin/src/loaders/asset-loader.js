import { getOptions } from 'loader-utils'
import AssetDependency from '../AssetDependency'
import { asyncLoaderWrapper, evalModuleBundleCode } from '../utils'
import path from 'path'

/**
 * @param {import('webpack').Compilation} compilation
 * @param {*} id
 */
function getModuleIdentifier(compilation, id) {
  const modules = compilation.modules
  const chunkGraph = compilation.chunkGraph
  for (const module of modules) {
    const moduleId = chunkGraph.getModuleId(module)
    if (moduleId === id) return module.identifier()
  }
  return null
}

export default asyncLoaderWrapper(async function (source) {
  const options = getOptions(this) || {}
  const { type, outputPath, outputDir } = options

  this.cacheable()

  switch (type) {
    case 'miniprogram/wxss': {
      const {
        exports: { exports },
        compilation,
      } = await evalModuleBundleCode(this, source, this.request)
      exports.forEach(([moduleId, content, sourceMap]) => {
        const identifier = getModuleIdentifier(compilation, moduleId)
        this._module.addDependency(new AssetDependency(type, identifier, this.context, content, outputPath, sourceMap))
      })
      break
    }
    case 'miniprogram/json': {
      const identifier = this._module.identifier()
      const { exports: moduleContent } = await evalModuleBundleCode(this, source, this.request)
      this._module.addDependency(
        new AssetDependency(type, identifier, this.context, JSON.stringify(moduleContent, null, 2), outputPath),
      )
      break
    }
    case 'miniprogram/wxml': {
      const {
        exports: { exports },
        compilation,
      } = await evalModuleBundleCode(this, source, this.request)
      exports.forEach(([moduleId, content, url, sourceMap], index) => {
        const identifier = getModuleIdentifier(compilation, moduleId)
        this._module.addDependency(
          new AssetDependency(
            type,
            identifier,
            this.context,
            content,
            index === exports.length - 1 // 列表最后一个是最顶层 wxml, 直接使用 outputPath
              ? outputPath
              : path.join(outputDir, url),
            sourceMap,
          ),
        )
      })
      break
    }
  }

  return `// asset ${this.request}`
})
