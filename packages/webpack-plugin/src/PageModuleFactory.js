import path from 'path'
import VirtualDependency from './VirtualDependency'
import PageDependency from './PageDependency'
import PageModule from './PageModule'

class PageModuleFactory {
  /**
   *
   * @param {import('webpack/lib/ResolverFactory')} resolverFactory
   */
  constructor(resolverFactory) {
    this.resolverFactory = resolverFactory
  }

  create(data, callback) {
    const [dependency] = data.dependencies
    if (dependency instanceof PageDependency) {
      return this._create(dependency, data).then(
        res => callback(null, res),
        err => callback(err),
      )
    }
    callback()
  }

  /**
   * @param {PageDependency} dependency
   */
  async _create(dependency, data) {
    const resolver = this.resolverFactory.get('miniprogram/page')
    const jsResolver = this.resolverFactory.get('miniprogram/javascript')
    const jsonResolver = this.resolverFactory.get('miniprogram/json')
    const wxmlResolver = this.resolverFactory.get('miniprogram/wxml')

    const pageResourcePath = await new Promise((resolve, reject) => {
      resolver.resolve(data.contextInfo, data.context, dependency.request, {}, (err, res) =>
        err ? reject(err) : resolve(res),
      )
    })

    const pageContext = path.dirname(pageResourcePath)
    const pageBasename = path.basename(pageResourcePath, path.extname(pageResourcePath))

    const jsResourcePath = await new Promise((resolve, reject) => {
      jsResolver.resolve(data.contextInfo, pageContext, './' + pageBasename, {}, (err, res) =>
        err ? reject(err) : resolve(res),
      )
    })

    const jsonResourcePath = await new Promise((resolve, reject) => {
      jsonResolver.resolve(data.contextInfo, pageContext, './' + pageBasename, {}, (err, res) =>
        err ? reject(err) : resolve(res),
      )
    })

    const wxmlResourcePath = await new Promise((resolve, reject) => {
      wxmlResolver.resolve(data.contextInfo, pageContext, './' + pageBasename, {}, (err, res) =>
        err ? reject(err) : resolve(res),
      )
    })

    return new PageModule(
      data.context,
      [
        new VirtualDependency(
          `${require.resolve('./loaders/page-loader')}!${require.resolve(
            './loaders/asset-loader',
          )}?type=config!${jsonResourcePath}`,
        ),
        new VirtualDependency(`${require.resolve('./loaders/asset-loader')}?type=template!${wxmlResourcePath}`),
        new VirtualDependency(jsResourcePath),
      ],
      dependency.request,
    )
  }
}

export default PageModuleFactory
