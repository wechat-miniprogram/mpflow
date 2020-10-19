import { asyncLoaderWrapper, evalModuleBundleCode } from '../utils'

/**
 * page-json-raw-loader 用于读取 page.json 的文件内容，并生成最终的 page.json 文件
 * 不负责收集 page.json 中的依赖
 */
export default asyncLoaderWrapper(async function (source) {
  this.cacheable()

  const { exports: moduleContent } = await evalModuleBundleCode(this, source, this.resource)

  if (moduleContent.main) {
    moduleContent.main = 'main.js'
  }

  return 'module.exports = ' + JSON.stringify(moduleContent, null, 2)
})
