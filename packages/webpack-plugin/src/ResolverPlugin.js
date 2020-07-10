import deepmerge from 'deepmerge'
import DescriptionFileUtils from 'enhanced-resolve/lib/DescriptionFileUtils'
import JoinRequestPlugin from 'enhanced-resolve/lib/JoinRequestPlugin'
import TryNextPlugin from 'enhanced-resolve/lib/TryNextPlugin'
import path from 'path'

const deepMerge = (...objs) => objs.reduce((obj, rst) => deepmerge(rst, obj, { clone: false }), {})

function withStage(stage, hook) {
  const currentStage = (hook._withOptions || {}).stage || 0
  const resultStage = currentStage + stage

  const options = Object.assign({}, hook._withOptions || {}, { stage: resultStage })

  const mergeOptions = opt => Object.assign({}, options, typeof opt === 'string' ? { name: opt } : opt)

  const base = hook._withOptionsBase || hook
  const newHook = Object.create(base)

  newHook.tapAsync = (opt, fn) => base.tapAsync(mergeOptions(opt), fn)
  newHook.tap = (opt, fn) => base.tap(mergeOptions(opt), fn)
  newHook.tapPromise = (opt, fn) => base.tapPromise(mergeOptions(opt), fn)
  newHook._withOptions = options
  newHook._withOptionsBase = base
  return newHook
}

function toCamelCase(str) {
  return str.replace(/-([a-z])/g, str => str.substr(1).toUpperCase())
}

function ensureHook(resolver, name) {
  if (typeof name !== 'string') return name
  name = toCamelCase(name)
  if (/^before/i.test(name)) {
    return withStage(-10, ensureHook(resolver, name[6].toLowerCase() + name.substr(7)))
  }
  if (/^after/i.test(name)) {
    return withStage(10, ensureHook(resolver, name[5].toLowerCase() + name.substr(6)))
  }
  return resolver.ensureHook(name)
}

function getHook(resolver, name) {
  if (typeof name !== 'string') return name
  name = toCamelCase(name)
  if (/^before/i.test(name)) {
    return withStage(-10, getHook(resolver, name[6].toLowerCase() + name.substr(7)))
  }
  if (/^after/i.test(name)) {
    return withStage(10, getHook(resolver, name[5].toLowerCase() + name.substr(6)))
  }
  return resolver.getHook(name)
}

/**
 * 检查是否是绝对路径
 */
class AbsoluteKindPlugin {
  constructor(source, target) {
    this.source = source
    this.target = target
  }

  apply(resolver) {
    const target = ensureHook(resolver, this.target)
    getHook(resolver, this.source).tapAsync('AbsoluteKindPlugin', (request, resolveContext, callback) => {
      if (request.request[0] !== '/') return callback()
      resolver.doResolve(target, request, null, resolveContext, callback)
    })
  }
}

/**
 * resolve 模块时，根据其 package.json 中申明的 miniprogram 字段添加路径
 */
class ModuleFieldDirPlugin {
  constructor(source, fieldName, target) {
    this.source = source
    this.fieldName = fieldName
    this.target = target
  }

  apply(resolver) {
    const target = ensureHook(resolver, this.target)
    getHook(resolver, this.source).tapAsync('ModuleFieldDirPlugin', (request, resolveContext, callback) => {
      if (!request.descriptionFileRoot || path.join(request.descriptionFileRoot, request.relativePath) !== request.path)
        return callback()
      if (request.alreadyTriedMiniprogramField === request.descriptionFilePath) return callback()
      const content = request.descriptionFileData
      const filename = path.basename(request.descriptionFilePath)
      const miniprogramModule = content[this.fieldName]
      if (!miniprogramModule || typeof miniprogramModule !== 'string') return callback()

      const obj = Object.assign({}, request, {
        path: path.join(request.descriptionFileRoot, miniprogramModule),
        request: request.relativePath,
        alreadyTriedMiniprogramField: request.descriptionFilePath,
      })
      return resolver.doResolve(
        target,
        obj,
        'use ' + miniprogramModule + ' from ' + this.fieldName + ' in ' + filename,
        resolveContext,
        callback,
      )
    })
  }
}

/**
 * 向上查找 project.config.json 文件，使用其中的 miniprogramRoot 作为根路径
 */
class ProjectConfigFileRootPlugin {
  constructor(source, filename, fieldName, target) {
    this.source = source
    this.filename = filename
    this.fieldName = fieldName
    this.target = target
  }

  apply(resolver) {
    const target = resolver.ensureHook(this.target)
    resolver.getHook(this.source).tapAsync('ProjectConfigFileRootPlugin', (request, resolveContext, callback) => {
      const directory = request.path
      DescriptionFileUtils.loadDescriptionFile(resolver, directory, [this.filename], resolveContext, (err, result) => {
        if (err) return callback(err)
        if (!result) {
          if (resolveContext.missing) {
            this.filenames.forEach(filename => {
              resolveContext.missing.add(resolver.join(directory, filename))
            })
          }
          if (resolveContext.log) resolveContext.log('No project config file found')
          return callback()
        }
        const miniprogramRoot = path.join(result.directory, result.content[this.fieldName] || '')
        // const relativePath = "." + request.path.substr(result.directory.length).replace(/\\/g, "/");
        // const relativePath = '.' + request.request;
        const obj = Object.assign({}, request, {
          projectConfigPath: result.path,
          projectConfigData: result.content,
          projectConfigRoot: result.directory,
          path: miniprogramRoot,
          request: '.' + request.request,
        })
        resolver.doResolve(
          target,
          obj,
          'using project config file: ' + result.path + ' (root path: ' + miniprogramRoot + ')',
          resolveContext,
          (err, result) => {
            if (err) return callback(err)

            // Don't allow other processing
            if (result === undefined) return callback(null, null)
            callback(null, result)
          },
        )
      })
    })
  }
}

class MiniprogramResolverPlugin {
  /**
   *
   * @param {object} options
   * @param {boolean} [options.moduleToRelative] 当使用模块路径无法找到时，作为相对路径查找
   * @param {boolean} [options.absoluteToRelative] 当使用绝对路径无法找到时，作为小程序的绝对路径处理，会向上查找 project.config.json 中的 miniprogramRoot 作为根路径查找
   * @param {boolean} [options.usePkgField] 当无法找到对应文件时，尝试通过 package.json 中定义的 miniprogram 字段作为路径查找
   */
  constructor(options) {
    this.options = options
  }

  apply(resolver) {
    const { moduleToRelative, absoluteToRelative, usePkgField } = this.options

    const plugins = []

    if (moduleToRelative) {
      // 当作为模块查找时无法找到时，fallback 到相对路径查找
      plugins.push(
        // resolve('webpack') => resolve('./webpack')
        new TryNextPlugin('after-raw-module', 'fallback as relative', 'fallback-relative'),
        // fallback 到 relative
        new JoinRequestPlugin('fallback-relative', 'relative'),
      )
    }

    if (absoluteToRelative) {
      // 当作为绝对路径查找无法找到时，作为小程序的绝对路径处理
      plugins.push(
        new AbsoluteKindPlugin('after-after-described-resolve', 'miniprogram-absolute'),
        // 向上路径查找 project.config.json, 用其中 miniprogramRoot 作为根路径
        new ProjectConfigFileRootPlugin('miniprogram-absolute', 'project.config.json', 'miniprogramRoot', 'resolve'),
      )
    }

    if (usePkgField) {
      // 当无法找到对应文件时，尝试通过 package.json 中定义的 miniprogram 字段作为路径查找
      plugins.push(
        // resolve('weui-miniprogram/cell/cell') => resolve('weui-miniprogram/miniprogram_dist/cell/cell')
        new ModuleFieldDirPlugin('after-described-relative', 'miniprogram', 'resolve'),
      )
    }

    plugins.forEach(plugin => plugin.apply(resolver))
  }
}

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
       * 注册 sitemap.json 查找
       */
      compiler.resolverFactory.hooks.resolveOptions.for('miniprogram/sitemap').tap(PLUGIN_NAME, resolveOptions => ({
        fileSystem: compiler.inputFileSystem,
        ...deepMerge(
          {
            extensions: ['.json'],
            plugins: [new MiniprogramResolverPlugin({ moduleToRelative: true, absoluteToRelative: true })],
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
          {
            extensions: ['.js'],
            plugins: [
              new MiniprogramResolverPlugin({ moduleToRelative: true, absoluteToRelative: true, usePkgField: true }),
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
          compiler.resolverFactory.hooks.resolveOptions.for('normal').call(this.options.javascript || {}),
          resolveOptions,
        ),
      }))

      /**
       * 注册 json 文件查找
       */
      compiler.resolverFactory.hooks.resolveOptions.for('miniprogram/json').tap(PLUGIN_NAME, resolveOptions => ({
        fileSystem: compiler.inputFileSystem,
        ...deepMerge(
          {
            extensions: ['.json'],
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
          {
            extensions: ['.wxml'],
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
          {
            extensions: ['.wxss'],
          },
          this.options.wxss || {},
          resolveOptions,
        ),
      }))
    })
  }
}

export default WeflowResolverPlugin
