import { getOptions, interpolateName, stringifyRequest, urlToRequest } from 'loader-utils'
import { pluginJsonLoader } from './index'
import { asyncLoaderWrapper, resolveWithType, stringifyResource } from './utils'

const jsonLoader = require.resolve('json-loader')
const fileLoader = require.resolve('file-loader')
const extractLoader = require.resolve('extract-loader')

/**
 * @type {import('webpack').loader.Loader}
 */
export const pitch = asyncLoaderWrapper(async function () {
  const options = getOptions(this) || {}
  const appContext = options.appContext || this.context

  const imports = []

  const resolveName = urlToRequest(interpolateName(this, options.resolveName || '[name]', { context: this.context }))

  // 加载 json
  const jsonRequest = await resolveWithType(this, 'miniprogram/json', resolveName)
  // 用 plugin-json-loader 解析 plugin.json 中的依赖
  imports.push(
    stringifyResource(
      jsonRequest,
      [
        {
          loader: fileLoader,
          options: {
            name: `plugin.json`,
          },
        },
        {
          loader: extractLoader,
        },
        {
          loader: pluginJsonLoader,
          options: {
            appContext,
          },
        },
        {
          loader: jsonLoader,
        },
      ],
      {
        disabled: 'normal',
      },
    ),
  )

  let code = ''

  for (const importRequest of imports) {
    code += `require(${stringifyRequest(this, importRequest)});\n`
  }

  return code
})

export default () => {}
