import { asyncLoaderWrapper } from '../utils'

export default asyncLoaderWrapper(async function (source) {
  this.cacheable(false) // 由于需要 addEntry 所以不能缓存

  const moduleContent = JSON.parse(source)

  // TODO 处理 ext.json 中内容，收集依赖

  return JSON.stringify(moduleContent, null, 2)
})
