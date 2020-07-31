import { getOptions } from 'loader-utils'
import { assetLoader, pageLoader } from './index'
import {
  addDependency,
  addExternal,
  asyncLoaderWrapper,
  getPageOutputPath,
  getWeflowLoaders,
  isRequest,
  resolveWithType,
  stringifyResource,
} from '../utils'

export default asyncLoaderWrapper(async function (source) {
  const options = getOptions(this) || {}
  const appContext = options.appContext || this.context

  this.cacheable(false) // 由于需要 addEntry 所以不能缓存

  const moduleContent = JSON.parse(source)

  if (Array.isArray(moduleContent.pages)) {
    // 对 app.json 中读取到的 pages 分别设立为入口
    for (const pageRequest of moduleContent.pages) {
      if (!isRequest(pageRequest)) continue // 跳过 plugins:// 等等

      const resolvedPageRequest = await resolveWithType(this, 'miniprogram/page', pageRequest)
      const chunkName = getPageOutputPath(appContext, '/', pageRequest, resolvedPageRequest)

      await addExternal(
        this,
        stringifyResource(
          resolvedPageRequest,
          [
            {
              loader: pageLoader,
              options: {
                appContext: appContext,
                outputPath: chunkName,
              },
            },
            ...getWeflowLoaders(this, resolvedPageRequest, 'page'),
          ],
          {
            disabled: 'normal',
          },
        ),
        'page',
        chunkName,
      )
    }
  }

  if (typeof moduleContent.sitemapLocation === 'string') {
    // 对 app.json 中的 sitemapLocation 做处理
    const sitemapRequest = moduleContent.sitemapLocation
    const resolvedSitemapRequest = await resolveWithType(this, 'miniprogram/sitemap', sitemapRequest)

    addDependency(
      this,
      stringifyResource(
        resolvedSitemapRequest,
        [
          {
            loader: assetLoader,
            options: {
              type: 'miniprogram/json',
              outputPath: 'sitemap.json',
            },
          },
          ...getWeflowLoaders(this, resolvedSitemapRequest, 'sitemap'),
        ],
        {
          disabled: 'normal',
        },
      ),
    )

    moduleContent.sitemapLocation = 'sitemap.json'
  }

  return JSON.stringify(moduleContent, null, 2)
})
