import { getOptions } from 'loader-utils'
import path from 'path'
import {
  addDependency,
  addExternal,
  asyncLoaderWrapper,
  evalModuleBundleCode,
  getMpflowLoaders,
  getPageOutputPath,
  isRequest,
  resolveWithType,
  stringifyResource,
} from '../utils'
import { assetLoader, pageLoader } from './index'

/**
 * app-json-loader 用于读取 app.json 的文件内容，并收集其中的依赖
 * 不负责生成最终的 app.json 文件
 */
export default asyncLoaderWrapper(async function (source) {
  const options = getOptions(this) || {}
  const appContext = options.appContext ?? path.relative(this.rootContext, this.context)

  this.cacheable(false) // 由于需要 addEntry 所以不能缓存

  const { exports: moduleContent } = await evalModuleBundleCode(this, source, this.resource)

  // 全局使用组件
  if (moduleContent.usingComponents) {
    // 对 app.json 中读取到的 usingComponents 分别设立为入口
    for (const componentRequest of Object.values(moduleContent.usingComponents)) {
      if (!isRequest(componentRequest)) continue

      const resolvedComponentRequest = await resolveWithType(this, 'miniprogram/page', componentRequest)
      const chunkName = getPageOutputPath(this.rootContext, appContext, '/', componentRequest, resolvedComponentRequest)

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
            ...getMpflowLoaders(this, resolvedComponentRequest, 'page'),
          ],
          { disabled: 'normal' },
        ),
        'page',
        chunkName,
        chunkName,
      )
    }
  }

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
        chunkName,
      )
    }
  }

  const subPackages = moduleContent.subPackages || moduleContent.subpackages;
  if (Array.isArray(subPackages)) {
    // 处理分包规则
    for (const pkg of subPackages) {
      const { root, pages } = pkg

      if (!root || !Array.isArray(pages)) continue

      for (const page of pages) {
        if (!isRequest(page)) continue

        // 尝试使用 root/page 解析
        const pageRequest = path.join(root, page)

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
          chunkName,
        )
      }
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

  return '//'
})
