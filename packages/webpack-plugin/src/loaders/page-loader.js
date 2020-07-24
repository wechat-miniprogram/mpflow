import { getOptions, interpolateName, stringifyRequest, urlToRequest } from 'loader-utils'
import { pageJsonLoader } from './index'
import { asyncLoaderWrapper, getWeflowLoaders, resolveWithType, stringifyResource } from './utils'

const extractLoader = require.resolve('extract-loader')
const fileLoader = require.resolve('file-loader')
const wxssLoader = require.resolve('@weflow/wxss-loader')
const wxmlLoader = require.resolve('@weflow/wxml-loader')
const jsonLoader = require.resolve('json-loader')

/**
 * @type {import('webpack').loader.Loader}
 */
export const pitch = asyncLoaderWrapper(async function () {
  const options = getOptions(this) || {}
  const { appContext, outputPath } = options

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
        {
          loader: wxmlLoader,
        },
        ...getWeflowLoaders(this, wxmlRequest, 'wxml'),
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
          {
            loader: wxssLoader,
          },
          ...getWeflowLoaders(this, wxssRequest, 'wxss'),
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
              outputPath,
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
          ...getWeflowLoaders(this, jsonRequest, 'json'),
        ],
        { disabled: 'normal' },
      ),
    )
  } catch (e) {
    // page.json 可选
  }

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
