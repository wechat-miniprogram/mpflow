import path from 'path'
import { asyncLoaderWrapper } from './utils'
import { getOptions, interpolateName, urlToRequest, getRemainingRequest } from 'loader-utils'
import { externalLoader, assetLoader, pageLoader } from './index'

function resolve(loader, type, request) {
  const resolver = loader._compiler.resolverFactory.get(type)
  return new Promise((resolve, reject) => {
    resolver.resolve({}, loader.context, request, {}, (err, result) => (err ? reject(err) : resolve(result)))
  })
}

/**
 * 获取一个组件应该输出的路径位置
 * @param {string} rootContext
 * @param {string} pageRequest
 */
function getPageOutputPath(rootContext, pageRequest) {
  return path
    .relative(rootContext, path.join(path.dirname(pageRequest), path.basename(pageRequest, path.extname(pageRequest))))
    .replace(/^\.\//, '')
}

/**
 * @type {import('webpack').loader.Loader}
 */
const loader = asyncLoaderWrapper(async function (source) {
  const options = getOptions(this) || {}
  const { outputPath } = options

  const moduleContent = this.exec(source, this.resourcePath)

  let code = ''

  if (moduleContent.usingComponents) {
    // 对 comp.json 中读取到的 usingComponents 分别设立为入口
    for (const componentRequest of Object.values(moduleContent.usingComponents)) {
      const resolvedComponentRequest = await resolve(this, 'miniprogram/page', componentRequest)
      const chunkName = getPageOutputPath(this.rootContext, resolvedComponentRequest)
      code += `require("${externalLoader}?name=${chunkName}!${pageLoader}?outputPath=${chunkName}!${resolvedComponentRequest}");\n`
    }
  }

  const resolveName = urlToRequest(interpolateName(this, options.resolveName || '[name]', { context: this.context }))

  const wxmlRequest = await resolve(this, 'miniprogram/wxml', resolveName)
  code += `require("${assetLoader}?type=template&outputPath=${outputPath}.wxml!${wxmlRequest}");\n`

  const wxssRequest = await resolve(this, 'miniprogram/wxss', resolveName)
  code += `require("${assetLoader}?type=style&outputPath=${outputPath}.wxss!${wxssRequest}");\n`

  code += `require("-!${assetLoader}?type=config&outputPath=${outputPath}.json!${getRemainingRequest(this)}");\n`

  const jsRequest = await resolve(this, 'miniprogram/javascript', resolveName)
  code += `require("${jsRequest}");\n`

  return code
})

export default loader
