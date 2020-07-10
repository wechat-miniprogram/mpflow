import path from 'path'
import loaderUtils from 'loader-utils'
import { evalModuleBundleCode, asyncLoaderWrapper } from './utils'

const loaderName = 'asset-loader'

/**
 * @type {import('webpack').loader.Loader}
 */
const assetLoader = source => source
export default assetLoader

export const pitch = asyncLoaderWrapper(async function pitch() {
  const options = loaderUtils.getOptions(this) || {}
  const { type, outputPath } = options

  if (type === 'config') {
    // 通过 eval 获取模块运行后的内容
    const { exports } = await evalModuleBundleCode(loaderName, this)
    const content = JSON.stringify(exports, null, 2)
    this.emitFile(outputPath, content)

    return 'module.exports = ' + content
  } else if (type === 'template') {
    // 通过 eval 获取模块运行后的内容
    const {
      exports: { imports, exports },
    } = await evalModuleBundleCode(loaderName, this)

    // 将 wxml import 的文件单独输出
    imports.forEach(([, content, , importOutput]) => {
      this.emitFile(path.join(path.dirname(outputPath || ''), importOutput), content)
    })

    this.emitFile(outputPath, exports)
    return '// asset'
  } else if (type === 'style') {
    // 通过 eval 获取模块运行后的内容
    const {
      exports: { imports, exports },
    } = await evalModuleBundleCode(loaderName, this)

    // 将 wxss import 的文件单独输出
    imports.forEach(([, content, , importOutput]) => {
      this.emitFile(path.join(path.dirname(outputPath || ''), importOutput), content)
    })

    this.emitFile(outputPath, exports)
    return '// asset'
  }

  return
})
