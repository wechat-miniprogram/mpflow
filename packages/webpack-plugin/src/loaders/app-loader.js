import { getOptions, interpolateName, stringifyRequest, urlToRequest } from 'loader-utils'
import path from 'path'
import { addDependency, asyncLoaderWrapper, getMpflowLoaders, resolveWithType, stringifyResource } from '../utils'
import { appJsonLoader, appJsonRawLoader, assetLoader, extJsonLoader, extJsonRawLoader } from './index'

/**
 * @type {import('webpack').loader.Loader}
 */
export const pitch = asyncLoaderWrapper(async function () {
  const options = getOptions(this) || {}
  const appContext = options.appContext ?? path.relative(this.rootContext, this.context)

  this.cacheable()

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
          ...getMpflowLoaders(this, wxssRequest, 'wxss'),
        ],
        { disabled: 'normal' },
      ),
    )
  } catch (e) {
    // app.wxss 可选
  }

  try {
    // 加载第三方平台代开发小程序的 ext.json
    const extJsonRequest = await resolveWithType(this, 'miniprogram/json', 'ext')

    // 用 ext-json-loader 解析 ext.json 中的依赖
    addDependency(
      this,
      stringifyResource(
        extJsonRequest,
        [
          {
            loader: extJsonLoader,
            options: {
              appContext: appContext,
            },
          },
          ...getMpflowLoaders(this, extJsonRequest, 'json'),
        ],
        {
          disabled: 'normal',
        },
      ),
    )

    // 用 ext-json-raw-loader 获取最终的 ext.json
    addDependency(
      this,
      stringifyResource(
        extJsonRequest,
        [
          {
            loader: assetLoader,
            options: {
              type: 'miniprogram/json',
              outputPath: 'ext.json',
            },
          },
          {
            loader: extJsonRawLoader,
          },
          ...getMpflowLoaders(this, extJsonRequest, 'json'),
        ],
        {
          disabled: 'normal',
        },
      ),
    )
  } catch (error) {
    // ext.json 可选
  }

  // 加载 json
  const jsonRequest = await resolveWithType(this, 'miniprogram/json', resolveName)

  // 用 app-json-loader 解析 app.json 中的依赖
  addDependency(
    this,
    stringifyResource(
      jsonRequest,
      [
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

  // 用 app-json-raw-loader 获取最终的 app.json
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
          loader: appJsonRawLoader,
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

  return `import ${stringifyRequest(this, exports)}`
})

export default () => {}
