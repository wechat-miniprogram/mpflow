import { getOptions } from 'loader-utils'
import path from 'path'
import {
  addEntry,
  asyncLoaderWrapper,
  evalModuleBundleCode,
  getMpflowLoaders,
  getPageOutputPath,
  isRequest,
  resolveWithType,
  stringifyResource,
} from '../utils'
import { pageLoader } from './index'

/**
 * plugin-loader 用于读取 plugin.json 的文件内容，并收集其中的依赖
 * @type {import('webpack').loader.Loader}
 */
export default asyncLoaderWrapper(async function (source) {
  const options = getOptions(this) || {}
  const appContext = options.appContext ?? path.relative(this.rootContext, this.context)

  this.cacheable(false) // 由于需要 addEntry 所以不能缓存

  const { exports: moduleContent } = await evalModuleBundleCode(this, source, this.resource)

  if (moduleContent.publicComponents || moduleContent.pages) {
    // 对 plugin.json 中读取到的 publicComponents 和 pages 分别设立为入口
    const pageRequests = [
      ...Object.values(moduleContent.publicComponents || {}),
      ...Object.values(moduleContent.pages || {}),
    ]

    for (const pageRequest of pageRequests) {
      if (!isRequest(pageRequest)) continue // 跳过 plugins:// 等等

      const resolvedComponentRequest = await resolveWithType(this, 'miniprogram/page', pageRequest)
      const chunkName = getPageOutputPath(this.rootContext, appContext, '/', pageRequest, resolvedComponentRequest)

      await addEntry(
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
            ...getMpflowLoaders(this, resolvedComponentRequest, 'page'),
          ],
          { disabled: 'normal' },
        ),
        chunkName,
      )
    }
  }

  if (moduleContent.main) {
    const mainRequest = moduleContent.main

    const resolvedMainRequest = await resolveWithType(this, 'miniprogram/javascript', mainRequest)

    await addEntry(
      this,
      stringifyResource(resolvedMainRequest, getMpflowLoaders(this, resolvedMainRequest, 'javascript'), {
        disabled: 'normal',
      }),
      'main',
    )
  }

  return '//'
})
