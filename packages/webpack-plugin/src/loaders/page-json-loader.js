import { getOptions, stringifyRequest } from 'loader-utils'
import { externalLoader, pageLoader } from './index'
import {
  asyncLoaderWrapper,
  evalModuleBundleCode,
  getPageOutputPath,
  resolveWithType,
  stringifyResource,
} from './utils'

const loaderName = 'page-json-loader'

/**
 * @type {import('webpack').loader.Loader}
 */
export const pitch = asyncLoaderWrapper(async function () {
  const options = getOptions(this) || {}
  const { appContext } = options

  const weflowLoaders = this.__weflowLoaders || {}

  const { exports: moduleContent } = await evalModuleBundleCode(loaderName, this)

  const imports = []

  if (moduleContent.usingComponents) {
    // 对 comp.json 中读取到的 usingComponents 分别设立为入口
    for (const componentRequest of Object.values(moduleContent.usingComponents)) {
      const resolvedComponentRequest = await resolveWithType(this, 'miniprogram/page', componentRequest)
      const context = appContext || this.context
      const chunkName = getPageOutputPath(context, resolvedComponentRequest)

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
                appContext: context,
                outputPath: chunkName,
              },
            },
            ...(weflowLoaders.page || []),
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

  return code
})

export default source => source
