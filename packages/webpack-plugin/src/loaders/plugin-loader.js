import { getOptions, interpolateName, urlToRequest } from 'loader-utils'
import path from 'path'
import { addDependency, asyncLoaderWrapper, getMpflowLoaders, resolveWithType, stringifyResource } from '../utils'
import { assetLoader, pluginJsonLoader, pluginJsonRawLoader } from './index'

/**
 * plugin-loader 用于导入插件入口
 * @type {import('webpack').loader.Loader}
 */
export const pitch = asyncLoaderWrapper(async function () {
  const options = getOptions(this) || {}
  const appContext = options.appContext ?? path.relative(this.rootContext, this.context)

  this.cacheable()

  const resolveName = urlToRequest(interpolateName(this, options.resolveName || '[name]', { context: this.context }))

  // 加载 json
  const jsonRequest = await resolveWithType(this, 'miniprogram/json', resolveName)

  // 用 plugin-json-loader 解析 plugin.json 中的依赖
  addDependency(
    this,
    stringifyResource(
      jsonRequest,
      [
        {
          loader: pluginJsonLoader,
          options: {
            appContext,
          },
        },
        ...getMpflowLoaders(this, jsonRequest, 'json'),
      ],
      {
        disabled: 'normal',
      },
    ),
  )

  // 用 plugin-json-raw-loader 获取最终 plugin.json
  addDependency(
    this,
    stringifyResource(
      jsonRequest,
      [
        {
          loader: assetLoader,
          options: {
            type: 'miniprogram/json',
            outputPath: `plugin.json`,
          },
        },
        {
          loader: pluginJsonRawLoader,
        },
        ...getMpflowLoaders(this, jsonRequest, 'json'),
      ],
      {
        disabled: 'normal',
      },
    ),
  )

  return '// plugin\n'
})

export default () => {}
