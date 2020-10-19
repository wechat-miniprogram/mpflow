import { asyncLoaderWrapper, evalModuleBundleCode } from '../utils'

/**
 * ext-json-raw-loader 用于读取 ext.json 的文件内容，并生成最终的 ext.json 文件
 * 不负责收集 ext.json 中的依赖
 */
export default asyncLoaderWrapper(async function (source) {
  this.cacheable()

  const { exports: moduleContent } = await evalModuleBundleCode(this, source, this.resource)

  // TODO 处理 ext.json 中内容

  return 'module.exports = ' + JSON.stringify(moduleContent, null, 2)
})
