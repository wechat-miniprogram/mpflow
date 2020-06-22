import path from 'path'
import SingleEntryDependency from 'webpack/lib/dependencies/SingleEntryDependency'
import VirtualDependency from './VirtualDependency'
import AppModule from './AppModule'

class AppModuleFactory {
  /**
   * @param {string} entry
   * @param {import('webpack/lib/ResolverFactory')} resolverFactory
   * @param {import('webpack/lib/NormalModuleFactory')} normalModuleFactory
   */
  constructor(entry, resolverFactory, normalModuleFactory) {
    this.entry = entry
    this.resolverFactory = resolverFactory
    this.normalModuleFactory = normalModuleFactory
  }

  create(data, callback) {
    const [dependency] = data.dependencies
    if (dependency instanceof SingleEntryDependency && dependency.request === this.entry) {
      // 拦截小程序入口的模块生成
      return this._create(dependency, data).then(
        res => callback(null, res),
        err => callback(err),
      )
    }
    // 其余入口走正常模块
    this.normalModuleFactory.create(data, callback)
  }

  /**
   * @param {SingleEntryDependency} dependency
   */
  async _create(dependency, data) {
    const resolver = this.resolverFactory.get('miniprogram/entry', {})
    const jsResolver = this.resolverFactory.get('miniprogram/javascript', {})
    const jsonResolver = this.resolverFactory.get('miniprogram/json', {})

    const appResourcePath = await new Promise((resolve, reject) => {
      resolver.resolve(data.contextInfo, data.context, dependency.request, {}, (err, res) =>
        err ? reject(err) : resolve(res),
      )
    })

    const appContext = path.dirname(appResourcePath)
    const appBasename = path.basename(appResourcePath, path.extname(appResourcePath))

    const jsResourcePath = await new Promise((resolve, reject) => {
      jsResolver.resolve(data.contextInfo, appContext, './' + appBasename, {}, (err, res) =>
        err ? reject(err) : resolve(res),
      )
    })

    const jsonResourcePath = await new Promise((resolve, reject) => {
      jsonResolver.resolve(data.contextInfo, appContext, './' + appBasename, {}, (err, res) =>
        err ? reject(err) : resolve(res),
      )
    })

    return new AppModule(
      data.context,
      [
        new VirtualDependency(
          `${require.resolve('./loaders/app-loader')}!${require.resolve(
            './loaders/asset-loader',
          )}?type=config!${jsonResourcePath}`,
        ),
        new VirtualDependency(jsResourcePath),
      ],
      dependency.request,
    )
  }
}

export default AppModuleFactory
