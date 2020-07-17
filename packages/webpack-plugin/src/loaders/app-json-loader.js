import { stringifyRequest } from 'loader-utils'
import { externalLoader, pageLoader } from './index'
import {
  asyncLoaderWrapper,
  evalModuleBundleCode,
  getPageOutputPath,
  getWeflowLoaders,
  resolveWithType,
  stringifyResource,
} from './utils'

const loaderName = 'app-json-loader'

/**
 * @type {import('webpack').loader.Loader}
 */
export const pitch = asyncLoaderWrapper(async function () {
  // const options = getOptions(this) || {}

  const { exports: moduleContent } = await evalModuleBundleCode(loaderName, this)

  const imports = []

  if (Array.isArray(moduleContent.pages)) {
    // 对 app.json 中读取到的 pages 分别设立为入口
    for (const pageRequest of moduleContent.pages) {
      const resolvedPageRequest = await resolveWithType(this, 'miniprogram/page', pageRequest)
      const outputPath = getPageOutputPath(this.context, resolvedPageRequest)

      imports.push(
        stringifyResource(
          resolvedPageRequest,
          [
            {
              loader: externalLoader,
              options: {
                name: outputPath,
              },
            },
            {
              loader: pageLoader,
              options: {
                appContext: this.context,
                outputPath: outputPath,
              },
            },
            ...getWeflowLoaders(this, resolvedPageRequest, 'page'),
          ],
          {
            disabled: 'normal',
          },
        ),
      )
    }
  }

  if (typeof moduleContent.sitemapLocation === 'string') {
    // 对 app.json 中的 sitemapLocation 做处理
    const sitemapRequest = moduleContent.sitemapLocation
    const resolvedSitemapRequest = await resolveWithType(this, 'miniprogram/sitemap', sitemapRequest)

    imports.push(
      stringifyResource(
        resolvedSitemapRequest,
        [
          {
            loader: require.resolve('file-loader'),
            options: {
              name: 'sitemap.json',
            },
          },
          ...getWeflowLoaders(this, resolvedSitemapRequest, 'sitemap'),
        ],
        {
          disabled: 'normal',
        },
      ),
    )

    moduleContent.sitemapLocation = 'sitemap.json'
  }

  let code = '//\n'

  for (const importRequest of imports) {
    code += `require(${stringifyRequest(this, importRequest)});\n`
  }

  return code
})

export default source => source
