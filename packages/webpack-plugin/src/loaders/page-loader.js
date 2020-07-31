import { getOptions, interpolateName, stringifyRequest, urlToRequest } from 'loader-utils'
import path from 'path'
import {
  addDependency,
  asyncLoaderWrapper,
  getPageOutputPath,
  getWeflowLoaders,
  markAsExternal,
  resolveWithType,
  stringifyResource,
} from '../utils'
import { assetLoader, pageJsonLoader } from './index'

const wxssLoader = require.resolve('@weflow/wxss-loader')
const wxmlLoader = require.resolve('@weflow/wxml-loader')

/**
 * @type {import('webpack').loader.Loader}
 */
export const pitch = asyncLoaderWrapper(async function () {
  const options = getOptions(this) || {}
  const appContext = options.appContext || this.context
  const outputPath =
    options.outputPath ||
    getPageOutputPath(appContext, '/', path.relative(appContext, this.resourcePath), this.resourcePath)

  this.cacheable()

  markAsExternal(this._module, 'page', outputPath)

  const resolveName = urlToRequest(interpolateName(this, options.resolveName || '[name]', { context: this.context }))

  // 加载 wxml
  const wxmlRequest = await resolveWithType(this, 'miniprogram/wxml', resolveName)
  addDependency(
    this,
    stringifyResource(
      wxmlRequest,
      [
        {
          loader: assetLoader,
          options: {
            type: 'miniprogram/wxml',
            outputDir: path.dirname(outputPath),
          },
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
    // 用 page-json-loader 解析 page.json 中的依赖, 并提取输出
    addDependency(
      this,
      stringifyResource(
        jsonRequest,
        [
          {
            loader: assetLoader,
            options: {
              type: 'miniprogram/json',
              outputPath: `${outputPath}.json`,
            },
          },
          {
            loader: pageJsonLoader,
            options: {
              appContext,
              outputPath,
            },
          },
          ...getWeflowLoaders(this, jsonRequest, 'json'),
        ],
        {
          disabled: 'normal',
        },
      ),
    )
  } catch (e) {
    // page.json 可选
  }

  // 加载 js 并且导出
  const jsRequest = await resolveWithType(this, 'miniprogram/javascript', resolveName)
  const exports = stringifyResource(jsRequest, getWeflowLoaders(this, jsRequest, 'javascript'), { disabled: 'normal' })

  return `module.exports = require(${stringifyRequest(this, exports)})`
})

export default () => {}
