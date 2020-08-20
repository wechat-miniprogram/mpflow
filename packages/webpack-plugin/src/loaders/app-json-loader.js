import { getOptions } from 'loader-utils'
import { assetLoader, pageLoader } from './index'
import {
  addDependency,
  addExternal,
  asyncLoaderWrapper,
  getPageOutputPath,
  getMpflowLoaders,
  isRequest,
  resolveWithType,
  stringifyResource,
} from '../utils'
import path from 'path'

export default asyncLoaderWrapper(async function (source) {
  const options = getOptions(this) || {}
  const appContext = options.appContext ?? path.relative(this.rootContext, this.context)

  this.cacheable(false) // 由于需要 addEntry 所以不能缓存

  const moduleContent = JSON.parse(source)

  if (Array.isArray(moduleContent.pages)) {
    // 对 app.json 中读取到的 pages 分别设立为入口
    for (const pageRequest of moduleContent.pages) {
      if (!isRequest(pageRequest)) continue // 跳过 plugins:// 等等

      const resolvedPageRequest = await resolveWithType(this, 'miniprogram/page', pageRequest)
      const chunkName = getPageOutputPath(this.rootContext, appContext, '/', pageRequest, resolvedPageRequest)

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
            ...getMpflowLoaders(this, resolvedPageRequest, 'page'),
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

  if (moduleContent.tabBar?.custom) {
    // 自定义 tabBar 则将 custom-tab-bar 加入构建
    const tabBarRequest =
      typeof moduleContent.tabBar.custom === 'string' ? moduleContent.tabBar.custom : '/custom-tab-bar/index'
    const resolvedTabBarRequest = await resolveWithType(this, 'miniprogram/page', tabBarRequest)
    const chunkName = 'custom-tab-bar/index'

    await addExternal(
      this,
      stringifyResource(
        resolvedTabBarRequest,
        [
          {
            loader: pageLoader,
            options: {
              appContext: appContext,
              outputPath: chunkName,
            },
          },
          ...getMpflowLoaders(this, resolvedTabBarRequest, 'page'),
        ],
        {
          disabled: 'normal',
        },
      ),
      'page',
      chunkName,
    )

    moduleContent.tabBar.custom = true
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
          ...getMpflowLoaders(this, resolvedSitemapRequest, 'sitemap'),
        ],
        {
          disabled: 'normal',
        },
      ),
    )

    moduleContent.sitemapLocation = 'sitemap.json'
  }

  if (typeof moduleContent.themeLocation === 'string') {
    // 对 app.json 中的 themeLocation 做处理
    const themeRequest = moduleContent.themeLocation
    const resolvedThemeRequest = await resolveWithType(this, 'miniprogram/json', themeRequest)

    addDependency(
      this,
      stringifyResource(
        resolvedThemeRequest,
        [
          {
            loader: assetLoader,
            options: {
              type: 'miniprogram/json',
              outputPath: 'theme.json',
            },
          },
          ...getMpflowLoaders(this, resolvedThemeRequest, 'json'),
        ],
        {
          disabled: 'normal',
        },
      ),
    )

    moduleContent.themeLocation = 'theme.json'
  }

  return JSON.stringify(moduleContent, null, 2)
})
