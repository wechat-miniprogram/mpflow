import { getOptions, getRemainingRequest, interpolateName, stringifyRequest, urlToRequest } from 'loader-utils'
import querystring from 'querystring'
import { appJsonLoader, assetLoader } from './index'
import { asyncLoaderWrapper, resolveWithType } from './utils'

/**
 * @type {import('webpack').loader.Loader}
 */
export const pitch = asyncLoaderWrapper(async function () {
  const options = getOptions(this) || {}

  const imports = []

  const resolveName = urlToRequest(interpolateName(this, options.resolveName || '[name]', { context: this.context }))

  // 加载 wxss
  try {
    const wxssRequest = await resolveWithType(this, 'miniprogram/wxss', resolveName)
    imports.push(
      `${assetLoader}?${querystring.stringify({
        type: 'style',
        outputPath: 'app.wxss',
      })}!${wxssRequest}`,
    )
  } catch (e) {
    // app.wxss 可选
  }

  // 加载 json
  const jsonRequest = await resolveWithType(this, 'miniprogram/json', resolveName)
  imports.push(
    `${appJsonLoader}!${assetLoader}?${querystring.stringify({
      type: 'config',
      outputPath: 'app.json',
    })}!${jsonRequest}`,
  )

  let code = ''

  for (const importRequest of imports) {
    code += `require(${stringifyRequest(this, importRequest)});\n`
  }

  // 加载 js 并且导出
  code += `\n module.exports = require(${stringifyRequest(this, `-!${getRemainingRequest(this)}`)})`

  return code
})

export default () => {}
