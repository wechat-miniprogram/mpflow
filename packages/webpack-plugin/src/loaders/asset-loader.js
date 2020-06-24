import loaderUtils from 'loader-utils'
import AssetDependency from '../AssetDependency'
import { evalModuleBundleCode, asyncLoaderWrapper } from './utils'

const loaderName = 'asset-loader'

/**
 * @type {import('webpack').loader.Loader}
 */
const assetLoader = source => source
export default assetLoader

function findModuleById(modules, id) {
  for (const module of modules) {
    if (module.id === id) {
      return module
    }
  }

  return null
}

export const pitch = asyncLoaderWrapper(async function pitch(request) {
  const options = loaderUtils.getOptions(this) || {}
  const { type } = options

  if (type === 'config') {
    // 通过 eval 获取模块运行后的内容
    const { exports } = await evalModuleBundleCode(loaderName, this)
    const content = JSON.stringify(exports, null, 2)
    this._module.addDependency(new AssetDependency('miniprogram/json', request, this.context, content))
    return content
  } else if (type === 'template') {
    // 通过 eval 获取模块运行后的内容
    const {
      exports: { imports, exports },
      compilation,
    } = await evalModuleBundleCode(loaderName, this)

    // 将 wxml import 的文件单独输出
    imports.forEach(([id, content, url, outputPath]) => {
      // const module = findModuleById(compilation.modules, id)

      this.emitFile(outputPath, content)

      // return {
      //   identifier: module.identifier(),
      //   context: module.context,
      //   content,
      //   url,
      //   outputPath,
      // }
    })

    // 将直接引用的 wxml 文件作为 Template 依赖
    this._module.addDependency(new AssetDependency('miniprogram/wxml', request, this.context, exports))
    return '// asset'
  }

  return
})
