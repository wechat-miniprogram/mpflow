import { getOptions, stringifyRequest } from 'loader-utils'
import { externalLoader, pageLoader } from './index'
import {
  asyncLoaderWrapper,
  evalModuleBundleCode,
  getPageOutputPath,
  getWeflowLoaders,
  isRequest,
  resolveWithType,
  stringifyResource,
} from './utils'

const loaderName = 'plugin-json-loader'

/**
 * @type {import('webpack').loader.Loader}
 */
export const pitch = asyncLoaderWrapper(async function () {
  const options = getOptions(this) || {}
  const appContext = options.appContext || this.context

  const { exports: moduleContent } = await evalModuleBundleCode(loaderName, this)

  const imports = []

  if (moduleContent.publicComponents || moduleContent.pages) {
    // 对 plugin.json 中读取到的 publicComponents 和 pages 分别设立为入口
    const pageRequests = [
      ...Object.values(moduleContent.publicComponents || {}),
      ...Object.values(moduleContent.pages || {}),
    ]

    for (const pageRequest of pageRequests) {
      if (!isRequest(pageRequest)) continue // 跳过 plugins:// 等等

      const resolvedComponentRequest = await resolveWithType(this, 'miniprogram/page', pageRequest)
      const chunkName = getPageOutputPath(appContext, '/', pageRequest, resolvedComponentRequest)

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

  if (moduleContent.main) {
    const mainRequest = moduleContent.main

    const resolvedMainRequest = await resolveWithType(this, 'miniprogram/javascript', mainRequest)

    imports.push(
      stringifyResource(
        resolvedMainRequest,
        [
          {
            loader: externalLoader,
            options: {
              name: 'main',
            },
          },
          ...getWeflowLoaders(this, resolvedMainRequest, 'javascript'),
        ],
        { disabled: 'normal' },
      ),
    )

    moduleContent.main = 'main.js'
  }

  let code = '//\n'

  for (const importRequest of imports) {
    code += `require(${stringifyRequest(this, importRequest)});\n`
  }

  code += `\nmodule.exports=${JSON.stringify(JSON.stringify(moduleContent, null, 2))};\n`

  return code
})

export default source => source
