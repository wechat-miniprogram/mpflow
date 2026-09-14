import path from 'path'
import { asyncLoaderWrapper, markAsExternal } from '../utils'

/**
 * lib-loader 用于生成独立于小程序/插件的 js 入口
 * @type {import('webpack').loader.Loader}
 */
export const pitch = asyncLoaderWrapper(async function (remainRequest) {
  const options = this.getOptions()
  const outputPath = options.outputPath || path.basename(this.resourcePath)

  this.cacheable()

  markAsExternal(this._module, 'lib', outputPath)

  return `module.exports = require(${JSON.stringify(this.utils.contextify(this.context, '!!' + remainRequest))})`
})
