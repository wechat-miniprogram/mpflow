import path from 'path'
import loaderUtils from 'loader-utils'
import AssetDependency from '../AssetDependency'
import { evalModuleBundleCode, asyncLoaderWrapper } from './utils'

const loaderName = 'asset-loader'

/**
 * @type {import('webpack').loader.Loader}
 */
const assetLoader = source => source
export default assetLoader

export const pitch = asyncLoaderWrapper(async function pitch(request) {
  const options = loaderUtils.getOptions(this) || {}
  const { type, outputPath } = options

  if (type === 'config') {
    // 通过 eval 获取模块运行后的内容
    const { exports } = await evalModuleBundleCode(loaderName, this)
    const content = JSON.stringify(exports, null, 2)
    this._module.addDependency(new AssetDependency('miniprogram/json', request, this.context, content, outputPath))

    return 'module.exports = ' + content
  } else if (type === 'template') {
    // 通过 eval 获取模块运行后的内容
    const {
      exports: { imports, exports },
    } = await evalModuleBundleCode(loaderName, this)

    // 将 wxml import 的文件单独输出
    imports.forEach(([, content, , importOutput]) => {
      this._module.addDependency(
        new AssetDependency(
          'miniprogram/wxml',
          request,
          this.context,
          content,
          path.join(path.dirname(outputPath || ''), importOutput),
        ),
      )
    })

    // 将直接引用的 wxml 文件作为 Template 依赖
    this._module.addDependency(new AssetDependency('miniprogram/wxml', request, this.context, exports, outputPath))
    return '// asset'
  } else if (type === 'style') {
    // 通过 eval 获取模块运行后的内容
    const {
      exports: { imports, exports },
    } = await evalModuleBundleCode(loaderName, this)

    // 将 wxss import 的文件单独输出
    imports.forEach(([, content, , importOutput]) => {
      this._module.addDependency(
        new AssetDependency(
          'miniprogram/wxml',
          request,
          this.context,
          content,
          path.join(path.dirname(outputPath || ''), importOutput),
        ),
      )
    })

    // 将直接引用的 wxss 文件作为 Template 依赖
    this._module.addDependency(new AssetDependency('miniprogram/wxss', request, this.context, exports, outputPath))
    return '// asset'
  }

  return
})
