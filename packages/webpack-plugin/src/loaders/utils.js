import NativeModule from 'module'
import NodeTemplatePlugin from 'webpack/lib/node/NodeTemplatePlugin'
import NodeTargetPlugin from 'webpack/lib/node/NodeTargetPlugin'
import LibraryTemplatePlugin from 'webpack/lib/LibraryTemplatePlugin'
import SingleEntryPlugin from 'webpack/lib/SingleEntryPlugin'
import LimitChunkCountPlugin from 'webpack/lib/optimize/LimitChunkCountPlugin'

export function evalModuleCode(loaderContext, code, filename) {
  const module = new NativeModule(filename, loaderContext)

  module.paths = NativeModule._nodeModulePaths(loaderContext.context) // eslint-disable-line no-underscore-dangle
  module.filename = filename
  module._compile(code, filename) // eslint-disable-line no-underscore-dangle

  return module.exports
}

export async function evalModuleBundleCode(loaderName, loaderContext) {
  const compilation = loaderContext._compilation
  // 除了自身之后的 loader 配置
  const loaders = loaderContext.loaders.slice(loaderContext.loaderIndex + 1)
  const resource = loaderContext.resource
  const context = loaderContext.context

  // 新建一个 childCompiler 对该文件进行处理
  const childFilename = '*'
  const outputOptions = { filename: childFilename }
  const childCompiler = compilation.createChildCompiler(`${loaderName} ${resource}`, outputOptions)

  new NodeTemplatePlugin(outputOptions).apply(childCompiler)
  new LibraryTemplatePlugin(null, 'commonjs2').apply(childCompiler)
  new NodeTargetPlugin().apply(childCompiler)
  new SingleEntryPlugin(context, `!!${resource}`, loaderName).apply(childCompiler)
  new LimitChunkCountPlugin({ maxChunks: 1 }).apply(childCompiler)

  // 设置 loader
  childCompiler.hooks.thisCompilation.tap(`${loaderName} loader`, compilation => {
    compilation.hooks.normalModuleLoader.tap(`${loaderName} loader`, (context, module) => {
      context.emitFile = loaderContext.emitFile

      if (module.request === resource && loaders.length) {
        module.loaders = loaders.map(loader => {
          return {
            loader: loader.path,
            options: loader.options,
            ident: loader.ident,
          }
        })
      }
    })
  })

  let source

  // 截获 childCompiler 编译结果
  childCompiler.hooks.afterCompile.tap(loaderName, compilation => {
    source = compilation.assets[childFilename] && compilation.assets[childFilename].source()

    // Remove all chunk assets
    compilation.chunks.forEach(chunk => {
      chunk.files.forEach(file => {
        delete compilation.assets[file] // eslint-disable-line no-param-reassign
      })
    })
  })

  return await new Promise((resolve, reject) => {
    childCompiler.runAsChild((err, entries, compilation) => {
      if (err) return reject(err)

      if (compilation.errors.length > 0) return reject(compilation.errors[0])

      if (!source) return reject(new Error("Didn't get a result from child compiler"))

      const exports = evalModuleCode(loaderContext, source, resource)

      resolve(exports)
    })
  })
}

/**
 * @param {import('webpack').loader.Loader} fn
 */
export function asyncLoaderWrapper(fn) {
  return function (...args) {
    const callback = this.async()
    Promise.resolve(fn.apply(this, args)).then(
      res => res ? callback(null, res) : callback(),
      err => callback(err),
    )
    return
  }
}
