import { getOptions, interpolateName, stringifyRequest, urlToRequest } from 'loader-utils'
import qs from 'querystring'
import { appJsonLoader } from './index'
import { asyncLoaderWrapper, resolveWithType } from './utils'

const extractLoader = require.resolve('extract-loader')
const fileLoader = require.resolve('file-loader')
const wxssLoader = require.resolve('@weflow/wxss-loader')

/**
 * @type {import('webpack').loader.Loader}
 */
export const pitch = asyncLoaderWrapper(async function () {
  const options = getOptions(this) || {}

  const imports = []
  let exports = null

  const resolveName = urlToRequest(interpolateName(this, options.resolveName || '[name]', { context: this.context }))

  // 加载 wxss
  try {
    const wxssRequest = await resolveWithType(this, 'miniprogram/wxss', resolveName)
    imports.push(
      `!!${fileLoader}?${qs.stringify({
        name: 'app.wxss',
      })}!${extractLoader}!${wxssLoader}!${wxssRequest}`,
    )
  } catch (e) {
    // app.wxss 可选
  }

  // 加载 json
  const jsonRequest = await resolveWithType(this, 'miniprogram/json', resolveName)
  imports.push(`${appJsonLoader}!${jsonRequest}`)
  imports.push(
    `!!${fileLoader}?${qs.stringify({
      name: 'app.json',
    })}!${jsonRequest}`,
  )

  // 加载 js 并且导出
  const jsRequest = await resolveWithType(this, 'miniprogram/javascript', resolveName)
  exports = jsRequest

  let code = ''

  for (const importRequest of imports) {
    code += `require(${stringifyRequest(this, importRequest)});\n`
  }

  if (exports) code += `\n module.exports = require(${stringifyRequest(this, jsRequest)})`

  return code
})

export default () => {}
