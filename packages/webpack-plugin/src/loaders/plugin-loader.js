import { getOptions, interpolateName, urlToRequest } from 'loader-utils'
import {
  addDependency,
  asyncLoaderWrapper,
  getWeflowLoaders,
  markAsExternal,
  resolveWithType,
  stringifyResource,
} from '../utils'
import { assetLoader, pluginJsonLoader } from './index'

/**
 * @type {import('webpack').loader.Loader}
 */
export const pitch = asyncLoaderWrapper(async function () {
  const options = getOptions(this) || {}
  const appContext = options.appContext || this.context

  this.cacheable()

  markAsExternal(this._module, 'plugin', 'plugin')

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
          loader: assetLoader,
          options: {
            type: 'miniprogram/json',
            outputPath: `plugin.json`,
          },
        },
        {
          loader: pluginJsonLoader,
          options: {
            appContext,
          },
        },
        ...getWeflowLoaders(this, jsonRequest, 'json'),
      ],
      {
        disabled: 'normal',
      },
    ),
  )

  return '// plugin\n'
})

export default () => {}
