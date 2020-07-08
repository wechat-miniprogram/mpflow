import { getOptions, getRemainingRequest, interpolateName, stringifyRequest, urlToRequest } from 'loader-utils'
import querystring from 'querystring'
import { assetLoader, pageJsonLoader } from './index'
import { asyncLoaderWrapper, resolveWithType } from './utils'

/**
 * @type {import('webpack').loader.Loader}
 */
export const pitch = asyncLoaderWrapper(async function () {
  const options = getOptions(this) || {}
  const { appContext, outputPath } = options

  const imports = []

  const resolveName = urlToRequest(interpolateName(this, options.resolveName || '[name]', { context: this.context }))

  // 加载 wxml
  const wxmlRequest = await resolveWithType(this, 'miniprogram/wxml', resolveName)
  imports.push(
    `${assetLoader}?${querystring.stringify({
      type: 'template',
      outputPath: `${outputPath}.wxml`,
    })}!${wxmlRequest}`,
  )

  // 加载 wxss
  try {
    const wxssRequest = await resolveWithType(this, 'miniprogram/wxss', resolveName)
    imports.push(
      `${assetLoader}?${querystring.stringify({
        type: 'style',
        outputPath: `${outputPath}.wxss`,
      })}!${wxssRequest}`,
    )
  } catch (e) {
    // page.wxss 可选
  }

  // 加载 json
  try {
    const jsonRequest = await resolveWithType(this, 'miniprogram/json', resolveName)
    imports.push(
      `${pageJsonLoader}?${querystring.stringify({
        appContext,
      })}!${assetLoader}?${querystring.stringify({
        type: 'config',
        outputPath: `${outputPath}.json`,
      })}!${jsonRequest}`,
    )
  } catch (e) {
    // page.json 可选
  }

  let code = ''

  for (const importRequest of imports) {
    code += `require(${stringifyRequest(this, importRequest)});\n`
  }

  // 加载 js 并且导出
  code += `\n module.exports = require(${stringifyRequest(this, getRemainingRequest(this))})`

  return code
})

export default () => {}
