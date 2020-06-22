import TryNextPlugin from 'enhanced-resolve/lib/TryNextPlugin'
import JoinRequestPlugin from 'enhanced-resolve/lib/JoinRequestPlugin'

/**
 * 检测绝对路径
 */
class AbsoluteKindPlugin {
  constructor(source, target) {
    this.source = source
    this.target = target
  }

  apply(resolver) {
    const target = resolver.ensureHook(this.target)
    resolver.getHook(this.source).tapAsync('AbsoluteKindPlugin', (request, resolveContext, callback) => {
      const isAbsolute = request.request[0] === '/'
      if (!isAbsolute) return callback()
      resolver.doResolve(target, request, null, resolveContext, callback)
    })
  }
}

/**
 * 绝对路径转换为相对路径
 */
class AbsoluteToRelativePlugin {
  constructor(source, target) {
    this.source = source
    this.target = target
  }

  apply(resolver) {
    const target = resolver.ensureHook(this.target)
    resolver.getHook(this.source).tapAsync('AbsoluteToRelativePlugin', (request, resolveContext, callback) => {
      const obj = Object.assign({}, request, {
        request: request.request[0] === '/' ? '.' + request.request : request.request,
      })
      resolver.doResolve(target, obj, null, resolveContext, callback)
    })
  }
}

const PLUGIN_NAME = 'MpResolverPlugin'

/**
 * 注册小程序文件路径查找的插件
 */
class MpResolverPlugin {
  constructor(options) {
    this.options = options
  }

  apply(compiler) {
    compiler.hooks.afterResolvers.tap(PLUGIN_NAME, () => {
      /**
       * 注册 app.json 查找
       */
      compiler.resolverFactory.hooks.resolveOptions.for('miniprogram/entry').tap(PLUGIN_NAME, resolveOptions =>
        compiler.resolverFactory.hooks.resolveOptions.for('normal').call({
          extensions: ['.json'],
          ...resolveOptions,
        }),
      )

      /**
       * 注册 page 组件 json 查找
       */
      compiler.resolverFactory.hooks.resolveOptions.for('miniprogram/page').tap(PLUGIN_NAME, resolveOptions =>
        compiler.resolverFactory.hooks.resolveOptions.for('normal').call({
          extensions: ['.json'],
          plugins: [
            new AbsoluteKindPlugin('after-described-resolve', 'absolute'),

            new AbsoluteToRelativePlugin('absolute', 'fallback-relative'),

            new TryNextPlugin('after-module', 'as relative', 'fallback-relative'),
            new JoinRequestPlugin('fallback-relative', 'relative'),
          ],
          ...resolveOptions,
        }),
      )

      compiler.resolverFactory.hooks.resolveOptions.for('miniprogram/json').tap(PLUGIN_NAME, resolveOptions =>
        compiler.resolverFactory.hooks.resolveOptions.for('normal').call({
          extensions: ['.json'],
          ...resolveOptions,
        }),
      )

      /**
       * 注册 js 文件查找
       */
      compiler.resolverFactory.hooks.resolveOptions.for('miniprogram/javascript').tap(PLUGIN_NAME, resolveOptions =>
        compiler.resolverFactory.hooks.resolveOptions.for('normal').call({
          ...resolveOptions,
        }),
      )

      /**
       * 注册 wxml 文件查找
       */
      compiler.resolverFactory.hooks.resolveOptions.for('miniprogram/wxml').tap(PLUGIN_NAME, resolveOptions =>
        compiler.resolverFactory.hooks.resolveOptions.for('normal').call({
          extensions: ['.wxml'],
          ...resolveOptions,
        }),
      )
    })
  }
}

export default MpResolverPlugin
