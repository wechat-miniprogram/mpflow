import path from 'path'
import { asyncLoaderWrapper } from './utils'
import { getOptions, interpolateName, urlToRequest, stringifyRequest, getRemainingRequest } from 'loader-utils'

function resolve(loader, type, request) {
  const resolver = loader._compiler.resolverFactory.get(type)
  return new Promise((resolve, reject) => {
    resolver.resolve({}, loader.context, request, {}, (err, result) => (err ? reject(err) : resolve(result)))
  })
}

const pageNameCountMap = new Map()
const pageRequestToNameMap = new Map()

function getPageName(pageRequest) {
  if (!pageRequestToNameMap.has(pageRequest)) {
    let pageName = interpolateName({ resourcePath: pageRequest }, 'page:[name]', {})
    const count = pageNameCountMap.get(pageName) || 0
    pageNameCountMap.set(pageName, count + 1)
    if (count) pageName += count
    pageRequestToNameMap.set(pageRequest, pageName)
  }
  return pageRequestToNameMap.get(pageRequest)
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
const appLoader = asyncLoaderWrapper(async function (source) {
  const options = getOptions(this) || {}

  const moduleContent = this.exec(source, this.resourcePath)

  const imports = []

  if (Array.isArray(moduleContent.pages)) {
    // 对 app.json 中读取到的 pages 分别设立为入口
    for (const pageRequest of moduleContent.pages) {
      const resolvedPageRequest = await resolve(this, 'miniprogram/page', pageRequest)
      const outputPath = getPageOutputPath(this.rootContext, resolvedPageRequest)
      imports.push(
        `${require.resolve('./external-loader')}?name=${outputPath}!${require.resolve(
          './page-loader',
        )}?outputPath=${outputPath}!${resolvedPageRequest}`,
      )
    }
  }

  const resolveName = urlToRequest(interpolateName(this, options.resolveName || '[name]', { context: this.context }))

  // 加载 wxss
  const wxssRequest = await resolve(this, 'miniprogram/wxss', resolveName)
  imports.push(`${require.resolve('./asset-loader')}?type=style&outputPath=app.wxss&output!${wxssRequest}`)

  // 加载 json
  // 只需要将自身套一个 asset-loader
  imports.push(`-!${require.resolve('./asset-loader')}?type=config&outputPath=app.json!${getRemainingRequest(this)}`)

  // 加载 js
  const jsRequest = await resolve(this, 'miniprogram/javascript', resolveName)
  imports.push(jsRequest)

  let code = ''

  for (const importRequest of imports) {
    code += `require(${stringifyRequest(this, importRequest)});\n`
  }

  return code
})

export default appLoader
