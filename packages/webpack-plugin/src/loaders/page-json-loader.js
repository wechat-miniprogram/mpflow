import { getOptions, stringifyRequest } from 'loader-utils'
import querystring from 'querystring'
import { externalLoader, pageLoader } from './index'
import { asyncLoaderWrapper, getJSONContent, getPageOutputPath, resolveWithType } from './utils'

/**
 * @type {import('webpack').loader.Loader}
 */
const pageJsonLoader = asyncLoaderWrapper(async function (source) {
  const options = getOptions(this) || {}
  const { appContext } = options

  const moduleContent = getJSONContent(this, source)

  const imports = []

  if (moduleContent.usingComponents) {
    // 对 comp.json 中读取到的 usingComponents 分别设立为入口
    for (const componentRequest of Object.values(moduleContent.usingComponents)) {
      const resolvedComponentRequest = await resolveWithType(this, 'miniprogram/page', componentRequest)
      const context = appContext || this.context
      const chunkName = getPageOutputPath(context, resolvedComponentRequest)

      imports.push(
        `${externalLoader}?${querystring.stringify({
          name: chunkName,
        })}!${pageLoader}?${querystring.stringify({
          appContext: context,
          outputPath: chunkName,
        })}!${resolvedComponentRequest}`,
      )
    }
  }

  let code = '//\n'

  for (const importRequest of imports) {
    code += `require(${stringifyRequest(this, importRequest)});\n`
  }

  return code
})

export default pageJsonLoader
