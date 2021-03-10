import NativeModule from 'module'
import path from 'path'
import qs from 'querystring'
import webpack from 'webpack'
import VirtualDependency from './VirtualDependency'

/**
 *
 * @param {any} loaderContext
 * @param {string} resource
 * @param {string} type
 * @return {{ loader: string, options: any }[]}
 */
export function getMpflowLoaders(loaderContext, resource, type) {
  const ruleSets = loaderContext.__mpflowRuleSets || {}

  const resourceQuery = ''
  const resourcePath = resource

  if (!ruleSets[type]) return []

  const result = ruleSets[type].exec({
    resource: resourcePath,
    realResource: resourcePath,
    resourceQuery,
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

/**
 * 添加新的小程序入口
 * @param {*} loaderContext
 * @param {string} request
 * @param {string} name
 */
export async function addEntry(loaderContext, request, name) {
  return new Promise((resolve, reject) => {
    const { _compilation: compilation, context } = loaderContext
    const dependency = webpack.EntryPlugin.createDependency(request, name)
    compilation.addEntry(context, dependency, name, err => (err ? reject(err) : resolve()))
  })
}

/**
 * 添加虚拟依赖
 * @param {*} loaderContext
 * @param {*} request
 */
export function addDependency(loaderContext, request) {
  loaderContext.addDependency(request)
  loaderContext._module.addDependency(new VirtualDependency(request))
}

export function evalModuleCode(loaderContext, code, filename) {
  const module = new NativeModule(filename, loaderContext)

  module.paths = NativeModule._nodeModulePaths(loaderContext.context) // eslint-disable-line no-underscore-dangle
  module.filename = filename
  module._compile(code, filename) // eslint-disable-line no-underscore-dangle

  return module.exports
}

/**
 * 执行获取一个 module 的实际导出内容
 * @param {*} loaderContext
 * @param {string} code
 * @param {string} filename
 * @param {string} [publicPath]
 */
export async function evalModuleBundleCode(loaderContext, code, filename, publicPath = '') {
  const compilation = loaderContext._compilation
  // 除了自身之后的 loader 配置
  const loaders = loaderContext.loaders.slice(loaderContext.loaderIndex + 1)
  const resource = loaderContext.resource
  const context = loaderContext.context

  // 新建一个 childCompiler 对该文件进行处理
  const childFilename = '*'
  const outputOptions = { filename: childFilename, publicPath }
  const childCompiler = compilation.createChildCompiler(`eval module code ${resource}`, outputOptions)

  new webpack.node.NodeTemplatePlugin(outputOptions).apply(childCompiler)
  new webpack.library.EnableLibraryPlugin('commonjs2').apply(childCompiler)
  new webpack.EntryPlugin(context, `!!${resource}`, {
    name: resource,
    library: { type: 'commonjs2' },
  }).apply(childCompiler)
  new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }).apply(childCompiler)

  // 设置 loader
  childCompiler.hooks.thisCompilation.tap(`eval module code loader`, compilation => {
    webpack.NormalModule.getCompilationHooks(compilation).loader.tap(`eval module code loader`, (context, module) => {
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
  childCompiler.hooks.compilation.tap('eval module code', compilation => {
    compilation.hooks.processAssets.tap('eval module code', () => {
      if (compilation.compiler !== childCompiler) return
      source = compilation.assets[childFilename] && compilation.assets[childFilename].source()

      // Remove all chunk assets
      compilation.chunks.forEach(chunk => {
        chunk.files.forEach(file => {
          compilation.deleteAsset(file)
        })
      })
    })
  })

  return await new Promise((resolve, reject) => {
    childCompiler.runAsChild((err, entries, compilation) => {
      if (err) return reject(err)

      if (compilation.errors.length > 0) return reject(compilation.errors[0])

      compilation.fileDependencies.forEach(dep => loaderContext.addDependency(dep))

      compilation.contextDependencies.forEach(dep => loaderContext.addContextDependency(dep))

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
 * @param {string} rootContext webpack 编译的根路径，绝对路径
 * @param {string} appContext app 根目录相对 rootContext 的相对路径
 * @param {string} currentOutputPath 引用的组件的输出路径，相对 rootContext 的相对路径
 * @param {string} rawRequest 用户直接在 usingComponents 语句中使用的字符串
 * @param {string} pageRequest 解析后 page 真正所在的位置，绝对路径
 */
export function getPageOutputPath(rootContext, appContext, currentOutputPath, rawRequest, pageRequest) {
  const relativePath = path.relative(
    path.resolve(rootContext, appContext),
    path.join(path.dirname(pageRequest), path.basename(pageRequest, path.extname(pageRequest))),
  )

  // 如果依然在 appContext 下，就保留目录结构
  if (!/^\.\.[\\/]/.test(relativePath)) return relativePath.replace(/^\.[\\/]/, '')

  // 不在 appContext 下，则放置到 miniprogram_npm 目录下
  return /^\./.test(rawRequest)
    ? path.join(path.dirname(currentOutputPath), rawRequest).replace(/^[\\/]/, '')
    : path.join('miniprogram_npm', rawRequest)
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

/**
 * 判断一个 request 是否应该处理
 * @param {string} request
 * @return {boolean}
 */
export function isRequest(request) {
  if (typeof request !== 'string' || !request) {
    return false
  }

  // 带有类似 plugin: 开头，并且不是 windows 的 path 如 C:\dir\file
  if (/^[a-z][a-z0-9+.-]*:/i.test(request) && !path.win32.isAbsolute(request)) {
    return false
  }

  return true
}
