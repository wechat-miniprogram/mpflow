import { getOptions, interpolateName, stringifyRequest, urlToRequest } from 'loader-utils'
import {
  addDependency,
  asyncLoaderWrapper,
  getMpflowLoaders,
  markAsExternal,
  resolveWithType,
  stringifyResource,
} from '../utils'
import { appJsonLoader, assetLoader } from './index'

const wxssLoader = require.resolve('@mpflow/wxss-loader')

/**
 * @type {import('webpack').loader.Loader}
 */
export const pitch = asyncLoaderWrapper(async function () {
  const options = getOptions(this) || {}
  const appContext = options.appContext || this.context

  this.cacheable()

  markAsExternal(this._module, 'app', 'app')

  const resolveName = urlToRequest(interpolateName(this, options.resolveName || '[name]', { context: this.context }))

  // 加载 wxss
  try {
    const wxssRequest = await resolveWithType(this, 'miniprogram/wxss', resolveName)
    addDependency(
      this,
      stringifyResource(
        wxssRequest,
        [
          {
            loader: assetLoader,
            options: {
              type: 'miniprogram/wxss',
            },
          },
          {
            loader: wxssLoader,
          },
          ...getMpflowLoaders(this, wxssRequest, 'wxss'),
        ],
        { disabled: 'normal' },
      ),
    )
  } catch (e) {
    // app.wxss 可选
  }

  // 加载 json
  const jsonRequest = await resolveWithType(this, 'miniprogram/json', resolveName)

  // 用 app-json-loader 解析 app.json 中的依赖, 并提取输出
  addDependency(
    this,
    stringifyResource(
      jsonRequest,
      [
        {
          loader: assetLoader,
          options: {
            type: 'miniprogram/json',
            outputPath: 'app.json',
          },
        },
        {
          loader: appJsonLoader,
          options: {
            appContext: appContext,
          },
        },
        ...getMpflowLoaders(this, jsonRequest, 'json'),
      ],
      {
        disabled: 'normal',
      },
    ),
  )

  // 加载 js 并且导出
  const jsRequest = await resolveWithType(this, 'miniprogram/javascript', resolveName)
  const exports = stringifyResource(jsRequest, getMpflowLoaders(this, jsRequest, 'javascript'), { disabled: 'normal' })

  return `module.exports = require(${stringifyRequest(this, exports)})`
})

export default () => {}
