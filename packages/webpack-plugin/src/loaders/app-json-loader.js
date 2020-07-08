import { stringifyRequest } from 'loader-utils'
import querystring from 'querystring'
import { assetLoader, externalLoader, pageLoader } from './index'
import { asyncLoaderWrapper, getJSONContent, getPageOutputPath, resolveWithType } from './utils'

/**
 * @type {import('webpack').loader.Loader}
 */
const appJsonLoader = asyncLoaderWrapper(async function (source) {
  // const options = getOptions(this) || {}

  const moduleContent = getJSONContent(this, source)

  const imports = []

  if (Array.isArray(moduleContent.pages)) {
    // 对 app.json 中读取到的 pages 分别设立为入口
    for (const pageRequest of moduleContent.pages) {
      const resolvedPageRequest = await resolveWithType(this, 'miniprogram/page', pageRequest)
      const outputPath = getPageOutputPath(this.context, resolvedPageRequest)

      imports.push(
        `${externalLoader}?${querystring.stringify({
          name: outputPath,
        })}!${pageLoader}?${querystring.stringify({
          appContext: this.context,
          outputPath: outputPath,
        })}!${resolvedPageRequest}`,
      )
    }
  }

  if (typeof moduleContent.sitemapLocation === 'string') {
    // 对 app.json 中的 sitemapLocation 做处理
    const sitemapRequest = moduleContent.sitemapLocation
    const resolvedSitemapRequest = await resolveWithType(this, 'miniprogram/sitemap', sitemapRequest)

    imports.push(
      `${assetLoader}?${querystring.stringify({
        type: 'config',
        outputPath: 'sitemap.json',
      })}!${resolvedSitemapRequest}`,
    )

    moduleContent.sitemapLocation = 'sitemap.json'
  }

  let code = '//\n'

  for (const importRequest of imports) {
    code += `require(${stringifyRequest(this, importRequest)});\n`
  }

  return code
})

export default appJsonLoader
