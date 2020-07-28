import { getOptions, interpolateName, stringifyRequest, urlToRequest } from 'loader-utils'
import { appJsonLoader } from './index'
import { asyncLoaderWrapper, getWeflowLoaders, resolveWithType, stringifyResource } from './utils'

const extractLoader = require.resolve('extract-loader')
const fileLoader = require.resolve('file-loader')
const wxssLoader = require.resolve('@weflow/wxss-loader')
const jsonLoader = require.resolve('json-loader')

/**
 * @type {import('webpack').loader.Loader}
 */
export const pitch = asyncLoaderWrapper(async function () {
  const options = getOptions(this) || {}
  const appContext = options.appContext || this.context

  const imports = []
  let exports = null

  const resolveName = urlToRequest(interpolateName(this, options.resolveName || '[name]', { context: this.context }))

  // 加载 wxss
  try {
    const wxssRequest = await resolveWithType(this, 'miniprogram/wxss', resolveName)
    imports.push(
      stringifyResource(
        wxssRequest,
        [
          {
            loader: fileLoader,
            options: {
              name: 'app.wxss',
            },
          },
          {
            loader: extractLoader,
          },
          {
            loader: wxssLoader,
          },
          ...getWeflowLoaders(this, wxssRequest, 'wxss'),
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
  imports.push(
    stringifyResource(
      jsonRequest,
      [
        {
          loader: fileLoader,
          options: {
            name: 'app.json',
          },
        },
        {
          loader: extractLoader,
        },
        {
          loader: appJsonLoader,
          options: {
            appContext: appContext,
          },
        },
        {
          loader: jsonLoader,
        },
        ...getWeflowLoaders(this, jsonRequest, 'json'),
      ],
      {
        disabled: 'normal',
      },
    ),
  )

  // 加载 js 并且导出
  const jsRequest = await resolveWithType(this, 'miniprogram/javascript', resolveName)
  exports = stringifyResource(jsRequest, getWeflowLoaders(this, jsRequest, 'javascript'), { disabled: 'normal' })

  let code = ''

  for (const importRequest of imports) {
    code += `require(${stringifyRequest(this, importRequest)});\n`
  }

  if (exports) code += `\n module.exports = require(${stringifyRequest(this, exports)})`

  return code
})

export default () => {}
