import path from 'path'
import { asyncLoaderWrapper } from './utils'
import { getOptions, interpolateName, urlToRequest, getRemainingRequest } from 'loader-utils'

function resolve(loader, type, request) {
  const resolver = loader._compiler.resolverFactory.get(type)
  return new Promise((resolve, reject) => {
    resolver.resolve({}, loader.context, request, {}, (err, result) => (err ? reject(err) : resolve(result)))
  })
}

/**
 * @type {import('webpack').loader.Loader}
 */
const appLoader = asyncLoaderWrapper(async function (source) {
  const options = getOptions(this) || {}
  const { outputPath } = options

  // const moduleContent = this.exec(source, this.resourcePath)

  let code = ''

  // if (Array.isArray(moduleContent.pages)) {
  //   // 对 app.json 中读取到的 pages 分别设立为入口
  //   for (const pageRequest of moduleContent.pages) {
  //     const resolvedPageRequest = await resolve(this, 'miniprogram/page', pageRequest)
  //     code += `require("${require.resolve('./external-loader')}?name=${pageRequest}!${require.resolve(
  //       './page-loader',
  //     )}!${resolvedPageRequest}");\n`
  //   }
  // }

  const resolveName = urlToRequest(interpolateName(this, options.resolveName || '[name]', { context: this.context }))

  const wxmlRequest = await resolve(this, 'miniprogram/wxml', resolveName)
  code += `require("${require.resolve(
    './asset-loader',
  )}?type=template&outputPath=${outputPath}.wxml!${wxmlRequest}");\n`

  const wxssRequest = await resolve(this, 'miniprogram/wxss', resolveName)
  code += `require("${require.resolve('./asset-loader')}?type=style&outputPath=${outputPath}.wxss!${wxssRequest}");\n`

  code += `require("-!${require.resolve(
    './asset-loader',
  )}?type=config&outputPath=${outputPath}.json!${getRemainingRequest(this)}");\n`

  const jsRequest = await resolve(this, 'miniprogram/javascript', resolveName)
  code += `require("${jsRequest}");\n`

  return code
})

export default appLoader
