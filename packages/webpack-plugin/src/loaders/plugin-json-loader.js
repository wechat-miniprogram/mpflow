import { getOptions } from 'loader-utils'
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
  const appContext = options.appContext || this.context

  this.cacheable()

  const moduleContent = JSON.parse(source)

  if (moduleContent.publicComponents || moduleContent.pages) {
    // 对 plugin.json 中读取到的 publicComponents 和 pages 分别设立为入口
    const pageRequests = [
      ...Object.values(moduleContent.publicComponents || {}),
      ...Object.values(moduleContent.pages || {}),
    ]

    for (const pageRequest of pageRequests) {
      if (!isRequest(pageRequest)) continue // 跳过 plugins:// 等等

      const resolvedComponentRequest = await resolveWithType(this, 'miniprogram/page', pageRequest)
      const chunkName = getPageOutputPath(appContext, '/', pageRequest, resolvedComponentRequest)

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

  if (moduleContent.main) {
    const mainRequest = moduleContent.main

    const resolvedMainRequest = await resolveWithType(this, 'miniprogram/javascript', mainRequest)

    await addExternal(
      this,
      stringifyResource(resolvedMainRequest, getWeflowLoaders(this, resolvedMainRequest, 'javascript'), {
        disabled: 'normal',
      }),
      'js',
      'main',
    )

    moduleContent.main = 'main.js'
  }

  return JSON.stringify(moduleContent, null, 2)
})
