import { getOptions, stringifyRequest } from 'loader-utils'
import { externalLoader, pageLoader } from './index'
import {
  asyncLoaderWrapper,
  evalModuleBundleCode,
  getPageOutputPath,
  getWeflowLoaders,
  resolveWithType,
  stringifyResource,
  isRequest,
} from './utils'

const loaderName = 'page-json-loader'

/**
 * @type {import('webpack').loader.Loader}
 */
export const pitch = asyncLoaderWrapper(async function () {
  const options = getOptions(this) || {}

  const appContext = options.appContext || this.context
  const outputPath = options.outputPath || '/'

  const { exports: moduleContent } = await evalModuleBundleCode(loaderName, this)

  const imports = []

  if (moduleContent.usingComponents) {
    // 对 comp.json 中读取到的 usingComponents 分别设立为入口
    for (const componentRequest of Object.values(moduleContent.usingComponents)) {
      if (!isRequest(componentRequest)) continue // 跳过 plugins:// 等等

      const resolvedComponentRequest = await resolveWithType(this, 'miniprogram/page', componentRequest)
      const chunkName = getPageOutputPath(appContext, outputPath, componentRequest, resolvedComponentRequest)

      imports.push(
        stringifyResource(
          resolvedComponentRequest,
          [
            {
              loader: externalLoader,
              options: {
                name: chunkName,
              },
            },
            {
              loader: pageLoader,
              options: {
                appContext: appContext,
                outputPath: chunkName,
              },
            },
            ...getWeflowLoaders(this, resolvedComponentRequest, 'page'),
          ],
          { disabled: 'normal' },
        ),
      )
    }
  }

  let code = '//\n'

  for (const importRequest of imports) {
    code += `require(${stringifyRequest(this, importRequest)});\n`
  }

  code += `\nmodule.exports=${JSON.stringify(JSON.stringify(moduleContent, null, 2))};\n`

  return code
})

export default source => source
