import PageDependency from '../PageDependency'
import { asyncLoaderWrapper } from './utils'

/**
 * @type {import('webpack').loader.Loader}
 */
const appLoader = asyncLoaderWrapper(async function (source) {
  const moduleContent = JSON.parse(source)

  if (Array.isArray(moduleContent.pages)) {
    // 对 app.json 中读取到的 pages 分别设立为入口
    for (const pageRequest of moduleContent.pages) {
      await new Promise((resolve, reject) => {
        this._compilation.addEntry(this.context, new PageDependency(pageRequest), pageRequest, err =>
          err ? reject(err) : resolve(),
        )
      })
    }
  }

  return source
})

export default appLoader
