import { asyncLoaderWrapper } from '../utils'

/**
 * ext-json-loader 用于读取 ext.json 的文件内容，并收集其中的依赖
 * 不负责生成最终的 ext.json 文件
 */
export default asyncLoaderWrapper(async function (source) {
  this.cacheable(false) // 由于需要 addEntry 所以不能缓存

  // const { exports: moduleContent } = await evalModuleBundleCode(this, source, this.resource)

  // TODO 处理 ext.json 中内容，收集依赖

  return '//'
})
