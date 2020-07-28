import { getRemainingRequest, stringifyRequest } from 'loader-utils'
import { pluginJsonLoader } from './index'
import { asyncLoaderWrapper, stringifyResource } from './utils'

const jsonLoader = require.resolve('json-loader')
const fileLoader = require.resolve('file-loader')
const extractLoader = require.resolve('extract-loader')

/**
 * @type {import('webpack').loader.Loader}
 */
export const pitch = asyncLoaderWrapper(async function () {
  // const options = getOptions(this) || {}
  // const { appContext, outputPath } = options

  const imports = []

  // const resolveName = urlToRequest(interpolateName(this, options.resolveName || '[name]', { context: this.context }))

  // 加载 json
  const jsonRequest = getRemainingRequest(this)
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
        },
        {
          loader: jsonLoader,
        },
      ],
      {
        disabled: 'all',
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
