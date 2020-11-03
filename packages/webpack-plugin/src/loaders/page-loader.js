import { getOptions, interpolateName, stringifyRequest, urlToRequest } from 'loader-utils'
import path from 'path'
import {
  addDependency,
  asyncLoaderWrapper,
  getPageOutputPath,
  getMpflowLoaders,
  markAsExternal,
  resolveWithType,
  stringifyResource,
} from '../utils'
import { assetLoader, pageJsonLoader, pageJsonRawLoader, stubLoader } from './index'

/**
 * @type {import('webpack').loader.Loader}
 */
export const pitch = asyncLoaderWrapper(async function () {
  const options = getOptions(this) || {}
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
            outputPath: `${outputPath}.wxml`,
          },
        },
        ...getMpflowLoaders(this, wxmlRequest, 'wxml'),
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
            loader: stubLoader,
          },
          ...getMpflowLoaders(this, wxssRequest, 'wxss'),
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
    addDependency(
      this,
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
          ...getMpflowLoaders(this, jsonRequest, 'json'),
        ],
        {
          disabled: 'normal',
        },
      ),
    )

    // 用 page-json-raw-loader 获取最终的 page.json
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
            loader: pageJsonRawLoader,
          },
          ...getMpflowLoaders(this, jsonRequest, 'json'),
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
  const exports = stringifyResource(jsRequest, getMpflowLoaders(this, jsRequest, 'javascript'), { disabled: 'normal' })

  return `module.exports = require(${stringifyRequest(this, exports)})`
})

export default () => {}
