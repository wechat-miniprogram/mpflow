import { getOptions, interpolateName, stringifyRequest, urlToRequest } from 'loader-utils'
import { appJsonLoader } from './index'
import { asyncLoaderWrapper, resolveWithType, stringifyResource } from './utils'

const extractLoader = require.resolve('extract-loader')
const fileLoader = require.resolve('file-loader')

/**
 * @type {import('webpack').loader.Loader}
 */
export const pitch = asyncLoaderWrapper(async function () {
  const options = getOptions(this) || {}

  const weflowLoaders = this.__weflowLoaders || {}

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
          ...(weflowLoaders.wxss || []),
        ],
        { disabled: 'normal' },
      ),
    )
  } catch (e) {
    // app.wxss 可选
  }

  // 加载 json
  const jsonRequest = await resolveWithType(this, 'miniprogram/json', resolveName)

  // 用 app-json-loader 解析 app.json 中的依赖
  imports.push(
    stringifyResource(
      jsonRequest,
      [
        {
          loader: appJsonLoader,
        },
        ...(weflowLoaders.json || []),
      ],
      {
        disabled: 'normal',
      },
    ),
  )
  // 将 app.json 提取输出
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
        ...(weflowLoaders.json || []),
      ],
      { disabled: 'normal' },
    ),
  )

  // 加载 js 并且导出
  const jsRequest = await resolveWithType(this, 'miniprogram/javascript', resolveName)
  exports = stringifyResource(jsRequest, weflowLoaders.javascript || [], { disabled: 'normal' })

  let code = ''

  for (const importRequest of imports) {
    code += `require(${stringifyRequest(this, importRequest)});\n`
  }

  if (exports) code += `\n module.exports = require(${stringifyRequest(this, jsRequest)})`

  return code
})

export default () => {}
