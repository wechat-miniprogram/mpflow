import { getOptions } from 'loader-utils'
import path from 'path'
import { pageLoader } from './index'
import {
  addExternal,
  asyncLoaderWrapper,
  getPageOutputPath,
  getWeflowLoaders,
  isRequest,
  resolveWithType,
  stringifyResource,
} from '../utils'

/**
 * @type {import('webpack').loader.Loader}
 */
export default asyncLoaderWrapper(async function (source) {
  const options = getOptions(this) || {}

  this.cacheable(false) // 由于需要 addEntry 所以不能缓存

  const appContext = options.appContext || this.context
  const outputPath =
    options.outputPath ||
    getPageOutputPath(appContext, '/', path.relative(appContext, this.resourcePath), this.resourcePath)

  const moduleContent = JSON.parse(source)

  if (moduleContent.usingComponents) {
    // 对 comp.json 中读取到的 usingComponents 分别设立为入口
    for (const componentRequest of Object.values(moduleContent.usingComponents)) {
      if (!isRequest(componentRequest)) continue // 跳过 plugins:// 等等

      const resolvedComponentRequest = await resolveWithType(this, 'miniprogram/page', componentRequest)
      const chunkName = getPageOutputPath(appContext, outputPath, componentRequest, resolvedComponentRequest)

      await addExternal(
        this,
        stringifyResource(
          resolvedComponentRequest,
          [
            {
              loader: pageLoader,
              options: {
                appContext: appContext,
                outputPath: chunkName,
              },
            },
            ...getWeflowLoaders(this, resolvedComponentRequest, 'page'),
          ],
          { disabled: 'normal' },
        ),
        'page',
        chunkName,
      )
    }
  }

  return JSON.stringify(moduleContent, null, 2)
})
