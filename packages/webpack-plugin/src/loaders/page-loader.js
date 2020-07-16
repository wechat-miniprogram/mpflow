import { getOptions, interpolateName, stringifyRequest, urlToRequest } from 'loader-utils'
import qs from 'querystring'
import { pageJsonLoader } from './index'
import { asyncLoaderWrapper, resolveWithType } from './utils'

const extractLoader = require.resolve('extract-loader')
const fileLoader = require.resolve('file-loader')
const wxmlLoader = require.resolve('@weflow/wxml-loader')
const wxssLoader = require.resolve('@weflow/wxss-loader')

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
    `!!${fileLoader}?${qs.stringify({
      name: `${outputPath}.wxml`,
    })}!${extractLoader}!${wxmlLoader}!${wxmlRequest}`,
  )

  // 加载 wxss
  try {
    const wxssRequest = await resolveWithType(this, 'miniprogram/wxss', resolveName)
    imports.push(
      `!!${fileLoader}?${qs.stringify({
        name: `${outputPath}.wxss`,
      })}!${extractLoader}!${wxssLoader}!${wxssRequest}`,
    )
  } catch (e) {
    // page.wxss 可选
  }

  // 加载 json
  try {
    const jsonRequest = await resolveWithType(this, 'miniprogram/json', resolveName)
    imports.push(
      `${pageJsonLoader}?${qs.stringify({
        appContext,
      })}!${jsonRequest}`,
    )
    imports.push(
      `!!${fileLoader}?${qs.stringify({
        name: `${outputPath}.json`,
      })}!${jsonRequest}`,
    )
  } catch (e) {
    // page.json 可选
  }

  // 加载 js 并且导出
  const jsRequest = await resolveWithType(this, 'miniprogram/javascript', resolveName)
  exports = jsRequest

  let code = ''

  for (const importRequest of imports) {
    code += `require(${stringifyRequest(this, importRequest)});\n`
  }

  if (exports) code += `\n module.exports = require(${stringifyRequest(this, exports)})`

  return code
})

export default () => {}
