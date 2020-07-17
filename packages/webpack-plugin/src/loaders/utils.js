import NativeModule from 'module'
import path from 'path'
import qs from 'querystring'
import LibraryTemplatePlugin from 'webpack/lib/LibraryTemplatePlugin'
import NodeTargetPlugin from 'webpack/lib/node/NodeTargetPlugin'
import NodeTemplatePlugin from 'webpack/lib/node/NodeTemplatePlugin'
import LimitChunkCountPlugin from 'webpack/lib/optimize/LimitChunkCountPlugin'
import SingleEntryPlugin from 'webpack/lib/SingleEntryPlugin'

/**
 *
 * @param {any} loaderContext
 * @param {string} resource
 * @param {string} type
 * @return {{ loader: string, options: any }[]}
 */
export function getWeflowLoaders(loaderContext, resource, type) {
  const ruleSets = loaderContext.__weflowRuleSets || {}

  const resourceQuery = ''
  const resourcePath = resource

  if (!ruleSets[type]) return []

  const result = ruleSets[type].exec({
    resource: resourcePath,
    realResource: resourcePath,
    resourceQuery,
    issuer: loaderContext._module.issuer,
    compiler: loaderContext._compiler,
  })

  const useLoadersPost = []
  const useLoaders = []
  const useLoadersPre = []

  for (const r of result) {
    if (r.type === 'use') {
      if (r.enforce === 'post') {
        useLoadersPost.push(r.value)
      } else if (r.enforce === 'pre') {
        useLoadersPre.push(r.value)
      } else if (!r.enforce) {
        useLoaders.push(r.value)
      }
    }
  }

  const loaders = useLoadersPost.concat(useLoaders, useLoadersPre)

  return loaders
}

/**
 *
 * @param {string} resource
 * @param {{ loader: string, options: any }[]} loaders
 * @param {object} [options]
 * @param {'normal' | 'pre-normal' | 'all'} [options.disabled]
 */
export function stringifyResource(resource, loaders, options = {}) {
  const { disabled } = options
  const segs = loaders.map(({ options, loader }) => {
    if (!options) return loader
    return `${loader}?${typeof options === 'object' ? qs.stringify(options) : options}`
  })
  segs.push(resource)

  let prefix = ''
  if (disabled === 'normal') {
    prefix = '!'
  } else if (disabled === 'pre-normal') {
    prefix = '-!'
  } else if (disabled === 'all') {
    prefix = '!!'
  }

  return `${prefix}${segs.join('!')}`
}

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
    if (compilation.compiler !== childCompiler) return

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

      resolve({ exports, compilation })
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
      res => (res ? callback(null, res) : callback()),
      err => callback(err),
    )
    return
  }
}

export function resolveWithType(loader, type, request) {
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
export function getPageOutputPath(rootContext, pageRequest) {
  return path
    .relative(rootContext, path.join(path.dirname(pageRequest), path.basename(pageRequest, path.extname(pageRequest))))
    .replace(/^\.\//, '')
}

export function getCurrentLoaderRequest(loaderContext, query) {
  const currentLoader = loaderContext.loaders[loaderContext.loaderIndex]
  const overrideQuery = qs.stringify(query)
  return `${currentLoader.path}${currentLoader.query}${currentLoader.query ? '&' : '?'}${overrideQuery}`
}

/**
 *
 * @param {*} loaderContext
 * @param {Buffer | string} source
 */
export function getJSONContent(loaderContext, source) {
  if (typeof source !== 'string') source = source.toString('utf-8')
  if (source.trim().startsWith('{')) return JSON.parse(source)
  return loaderContext.exec(source, loaderContext.resourcePath)
}
