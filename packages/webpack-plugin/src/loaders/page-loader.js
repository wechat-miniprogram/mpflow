import { getOptions, interpolateName, stringifyRequest, urlToRequest } from 'loader-utils'
import { pageJsonLoader } from './index'
import { asyncLoaderWrapper, resolveWithType, stringifyResource } from './utils'

const extractLoader = require.resolve('extract-loader')
const fileLoader = require.resolve('file-loader')

/**
 * @type {import('webpack').loader.Loader}
 */
export const pitch = asyncLoaderWrapper(async function () {
  const options = getOptions(this) || {}
  const { appContext, outputPath } = options

  const weflowLoaders = this.__weflowLoaders || {}

  const imports = []
  let exports

  const resolveName = urlToRequest(interpolateName(this, options.resolveName || '[name]', { context: this.context }))

  // 加载 wxml
  const wxmlRequest = await resolveWithType(this, 'miniprogram/wxml', resolveName)
  imports.push(
    stringifyResource(
      wxmlRequest,
      [
        {
          loader: fileLoader,
          options: {
            name: `${outputPath}.wxml`,
          },
        },
        {
          loader: extractLoader,
        },
        ...(weflowLoaders.wxml || []),
      ],
      { disabled: 'normal' },
    ),
  )

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
              name: `${outputPath}.wxss`,
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
    // page.wxss 可选
  }

  // 加载 json
  try {
    const jsonRequest = await resolveWithType(this, 'miniprogram/json', resolveName)
    // 用 page-json-loader 解析 page.json 中的依赖
    imports.push(
      stringifyResource(
        jsonRequest,
        [
          {
            loader: pageJsonLoader,
            options: {
              appContext,
            },
          },
          ...(weflowLoaders.json || []),
        ],
        {
          disabled: 'normal',
        },
      ),
    )
    // 将 page.json 提取输出
    imports.push(
      stringifyResource(
        jsonRequest,
        [
          {
            loader: fileLoader,
            options: {
              name: `${outputPath}.json`,
            },
          },
          ...(weflowLoaders.json || []),
        ],
        { disabled: 'normal' },
      ),
    )
  } catch (e) {
    // page.json 可选
  }

  // 加载 js 并且导出
  const jsRequest = await resolveWithType(this, 'miniprogram/javascript', resolveName)
  exports = stringifyResource(jsRequest, weflowLoaders.javascript || [], { disabled: 'normal' })

  let code = ''

  for (const importRequest of imports) {
    code += `require(${stringifyRequest(this, importRequest)});\n`
  }

  if (exports) code += `\n module.exports = require(${stringifyRequest(this, exports)})`

  return code
})

export default () => {}
