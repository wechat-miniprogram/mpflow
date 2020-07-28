import deepmerge from 'deepmerge'
import MiniprogramResolverPlugin from './resolvers/MiniprogramResolverPlugin'

const deepMerge = (...objs) => objs.reduce((obj, rst) => deepmerge(rst, obj, { clone: false }), {})

const PLUGIN_NAME = 'Weflow Resolver Plugin'

/**
 * 注册小程序文件路径查找的插件
 */
class WeflowResolverPlugin {
  constructor(options = {}) {
    this.options = options
  }

  apply(compiler) {
    compiler.hooks.afterResolvers.tap(PLUGIN_NAME, () => {
      /**
       * 让普通的 js import 也解析到 miniprogram_dist
       */
      compiler.resolverFactory.hooks.resolver.for('normal').tap(PLUGIN_NAME, resolver => {
        new MiniprogramResolverPlugin({ roots: this.options.roots, usePkgField: true }).apply(resolver)
      })

      /**
       * 注册 sitemap.json 查找
       */
      compiler.resolverFactory.hooks.resolveOptions.for('miniprogram/sitemap').tap(PLUGIN_NAME, resolveOptions => ({
        fileSystem: compiler.inputFileSystem,
        ...deepMerge(
          compiler.resolverFactory.hooks.resolveOptions.for('normal').call({ extensions: ['.json'] }),
          {
            plugins: [
              new MiniprogramResolverPlugin({ moduleToRelative: true, roots: this.options.roots, usePkgField: true }),
            ],
          },
          this.options.sitemap || {},
          resolveOptions,
        ),
      }))

      /**
       * 注册 page 组件 js 查找
       */
      compiler.resolverFactory.hooks.resolveOptions.for('miniprogram/page').tap(PLUGIN_NAME, resolveOptions => ({
        fileSystem: compiler.inputFileSystem,
        ...deepMerge(
          compiler.resolverFactory.hooks.resolveOptions.for('normal').call({}),
          {
            plugins: [
              new MiniprogramResolverPlugin({ moduleToRelative: true, roots: this.options.roots, usePkgField: true }),
            ],
          },
          this.options.page || {},
          resolveOptions,
        ),
      }))

      /**
       * 注册 js 文件查找
       */
      compiler.resolverFactory.hooks.resolveOptions.for('miniprogram/javascript').tap(PLUGIN_NAME, resolveOptions => ({
        fileSystem: compiler.inputFileSystem,
        ...deepMerge(
          compiler.resolverFactory.hooks.resolveOptions.for('normal').call({}),
          {
            plugins: [
              new MiniprogramResolverPlugin({ moduleToRelative: true, roots: this.options.roots, usePkgField: true }),
            ],
          },
          this.options.javascript || {},
          resolveOptions,
        ),
      }))

      /**
       * 注册 json 文件查找
       */
      compiler.resolverFactory.hooks.resolveOptions.for('miniprogram/json').tap(PLUGIN_NAME, resolveOptions => ({
        fileSystem: compiler.inputFileSystem,
        ...deepMerge(
          compiler.resolverFactory.hooks.resolveOptions.for('normal').call({ extensions: ['.json'] }),
          {
            plugins: [
              new MiniprogramResolverPlugin({ moduleToRelative: true, roots: this.options.roots, usePkgField: true }),
            ],
          },
          this.options.json || {},
          resolveOptions,
        ),
      }))

      /**
       * 注册 wxml 文件查找
       */
      compiler.resolverFactory.hooks.resolveOptions.for('miniprogram/wxml').tap(PLUGIN_NAME, resolveOptions => ({
        fileSystem: compiler.inputFileSystem,
        ...deepMerge(
          compiler.resolverFactory.hooks.resolveOptions.for('normal').call({ extensions: ['.wxml'] }),
          {
            plugins: [
              new MiniprogramResolverPlugin({ moduleToRelative: true, roots: this.options.roots, usePkgField: true }),
            ],
          },
          this.options.wxml || {},
          resolveOptions,
        ),
      }))

      /**
       * 注册 wxss 文件查找
       */
      compiler.resolverFactory.hooks.resolveOptions.for('miniprogram/wxss').tap(PLUGIN_NAME, resolveOptions => ({
        fileSystem: compiler.inputFileSystem,
        ...deepMerge(
          compiler.resolverFactory.hooks.resolveOptions.for('normal').call({ extensions: ['.wxss'] }),
          {
            plugins: [
              new MiniprogramResolverPlugin({ moduleToRelative: true, roots: this.options.roots, usePkgField: true }),
            ],
          },
          this.options.wxss || {},
          resolveOptions,
        ),
      }))
    })
  }
}

export default WeflowResolverPlugin
