import { getOptions } from 'loader-utils'
import path from 'path'
import {
  addExternal,
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
 * @type {import('webpack').loader.Loader}
 */
export default asyncLoaderWrapper(async function (source) {
  const options = getOptions(this) || {}
  const isExternalModule = this.__mpflowIsExternalModule

  this.cacheable(false) // 由于需要 addEntry 所以不能缓存

  const appContext = options.appContext ?? path.relative(this.rootContext, this.context)
  const outputPath =
    options.outputPath ??
    getPageOutputPath(
      this.rootContext,
      appContext,
      '/',
      path.relative(path.resolve(this.rootContext, appContext), this.resourcePath),
      this.resourcePath,
    )

  const { exports: moduleContent } = await evalModuleBundleCode(this, source, this.resource)

  const usingComponents = []

  if (moduleContent.usingComponents) {
    // 对 comp.json 中读取到的 usingComponents 分别设立为入口
    usingComponents.push(...Object.values(moduleContent.usingComponents))
  }

  if (moduleContent.componentGenerics) {
    // 对 comp.json 中读取到的 componentGenerics 分别设立为入口
    usingComponents.push(
      ...Object.values(moduleContent.componentGenerics).map(componentGeneric => componentGeneric?.default),
    )
  }

  for (const componentRequest of usingComponents) {
    if (!componentRequest) continue
    if (!isRequest(componentRequest)) continue // 跳过 plugins:// 等等
    if (isExternalModule && isExternalModule(componentRequest)) continue // 跳过外部模块

    const resolvedComponentRequest = await resolveWithType(this, 'miniprogram/page', componentRequest)
    const chunkName = getPageOutputPath(
      this.rootContext,
      appContext,
      outputPath,
      componentRequest,
      resolvedComponentRequest,
    )

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

  return '//'
})
