import NativeModule from 'module'
import path from 'path'
import qs from 'querystring'
import SingleEntryDependency from 'webpack/lib/dependencies/SingleEntryDependency'
import LibraryTemplatePlugin from 'webpack/lib/LibraryTemplatePlugin'
import NodeTargetPlugin from 'webpack/lib/node/NodeTargetPlugin'
import NodeTemplatePlugin from 'webpack/lib/node/NodeTemplatePlugin'
import LimitChunkCountPlugin from 'webpack/lib/optimize/LimitChunkCountPlugin'
import SingleEntryPlugin from 'webpack/lib/SingleEntryPlugin'
import VirtualDependency from './VirtualDependency'
import ExternalDependency from './ExternalDependency'

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

const MODULE_EXTERNAL_SYMBOL = Symbol('Module External')

/**
 * 检查一个 entryPoint 是否为小程序入口
 * @param {*} entryPoint
 * @return {{ type: string, outputPath: string } | undefined}
 */
export function isExternalEntryPoint(entryPoint) {
  if (!entryPoint || !entryPoint.chunks) return false
  for (const chunk of entryPoint.chunks) {
    const externalInfo = isExternalChunk(chunk)
    if (externalInfo) return externalInfo
  }
  return false
}

/**
 * 检查一个 chunk 是否为小程序入口
 * @param {*} chunk
 * @return {{ type: string, outputPath: string } | undefined}
 */
export function isExternalChunk(chunk) {
  if (!chunk || !chunk.entryModule) return false
  for (const module of Array.from(chunk.modulesIterable)) {
    if (module && module[MODULE_EXTERNAL_SYMBOL]) return module[MODULE_EXTERNAL_SYMBOL]
  }
  return false
}

/**
 * 标记当前的 chunk 为小程序入口
 * @param {*} module
 * @param {string} type
 * @param {string} outputPath
 */
export function markAsExternal(module, type, outputPath) {
  if (!module[MODULE_EXTERNAL_SYMBOL]) {
    module[MODULE_EXTERNAL_SYMBOL] = { type, outputPath }
  }
}

/**
 * 添加新的小程序入口
 * @param {*} loaderContext
 * @param {string} request
 * @param {string} type
 * @param {string} outputPath
 * @param {string} name
 */
export async function addExternal(loaderContext, request, externalType, outputPath, name) {
  return new Promise((resolve, reject) => {
    const { _compilation: compilation, context } = loaderContext
    const dependency = new ExternalDependency(request, externalType, outputPath)
    compilation.addEntry(context, dependency, name || String(compilation._preparedEntrypoints.length), err =>
      err ? reject(err) : resolve(),
    )
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

// export function evalModuleBundleCode(loaderContext, code, filename, publicPath = '') {
//   const moduleCache = new Map()
//   const context = loaderContext.context
//   const normalResolver = loaderContext._compiler.resolverFactory.get('normal')

//   const loadModule = deasync(function (request, callback) {
//     loaderContext.loadModule(request, (err, source) => {
//       if (err) return callback(err)
//       callback(null, source)
//     })
//   })

//   const resolveRequest = deasync(function (request, callback) {
//     const prefix = request.startsWith('-!')
//       ? '-!'
//       : request.startsWith('!!')
//       ? '!!'
//       : request.startsWith('!')
//       ? '!'
//       : ''
//     const elements = request.replace(/^-?!+/, '').replace(/!!+/g, '!').split('!')
//     const resource = elements.pop()

//     normalResolver.resolve({}, context, resource, {}, (err, resolvedResource) => {
//       if (err) return callback(err)
//       callback(null, prefix + elements.concat([resolvedResource]).join('!'))
//     })
//   })

//   function evalModule(src, filename) {
//     const transpiled = babel.transform(src, {
//       babelrc: false,
//       presets: [
//         [
//           require('@babel/preset-env'),
//           {
//             modules: 'commonjs',
//             targets: { node: 'current' },
//           },
//         ],
//       ],
//     })

//     const script = new vm.Script(transpiled.code, {
//       filename,
//       displayErrors: true,
//     })
//     const moduleExports = { exports: {}, id: filename }
//     const sandbox = Object.assign({}, global, {
//       module: moduleExports,
//       exports: moduleExports.exports,
//       __webpack_public_path__: publicPath,
//       require: requestPath => {
//         const resolvedRequestPath = resolveRequest(requestPath)
//         if (moduleCache.has(resolvedRequestPath)) return moduleCache.get(resolvedRequestPath).exports
//         const requestContent = loadModule(resolvedRequestPath)
//         const requestModule = evalModule(requestContent, resolvedRequestPath)
//         return requestModule.exports
//       },
//     })
//     script.runInNewContext(sandbox)

//     moduleCache.set(filename, moduleExports)

//     return moduleExports
//   }

//   return evalModule(code, filename)
// }

/**
 * 获取一个模块的 identifier
 * @param {*} compilation
 * @param {string} id
 */
export function getModuleIdentifier(compilation, id) {
  const modules = compilation.modules
  for (const module of modules) {
    if (module.id === id) return module.identifier()
  }
  return null
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

  new NodeTemplatePlugin(outputOptions).apply(childCompiler)
  new LibraryTemplatePlugin(null, 'commonjs2').apply(childCompiler)
  new NodeTargetPlugin().apply(childCompiler)
  new SingleEntryPlugin(context, `!!${resource}`, resource).apply(childCompiler)
  new LimitChunkCountPlugin({ maxChunks: 1 }).apply(childCompiler)

  // 设置 loader
  childCompiler.hooks.thisCompilation.tap(`eval module code loader`, compilation => {
    compilation.hooks.normalModuleLoader.tap(`eval module code loader`, (context, module) => {
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
  childCompiler.hooks.afterCompile.tap('eval module code', compilation => {
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
 * @param {string} appContext app 根目录
 * @param {string} currentPath 引用的组件的输出路径
 * @param {string} rawRequest 用户直接在 usingComponents 语句中使用的字符串
 * @param {string} pageRequest 解析后 page 真正所在的位置
 */
export function getPageOutputPath(appContext, currentPath, rawRequest, pageRequest) {
  const relativePath = path.relative(
    appContext,
    path.join(path.dirname(pageRequest), path.basename(pageRequest, path.extname(pageRequest))),
  )

  // 如果依然在 appContext 下，就保留目录结构
  if (!/^\.\.[\\/]/.test(relativePath)) return relativePath.replace(/^\.[\\/]/, '')

  // 不在 appContext 下，则放置到 miniprogram_npm 目录下
  return /^\./.test(rawRequest)
    ? path.join(path.dirname(currentPath), rawRequest).replace(/^[\\/]/, '')
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
