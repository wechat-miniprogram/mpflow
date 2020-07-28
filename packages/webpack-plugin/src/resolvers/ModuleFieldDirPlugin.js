import path from 'path'
import { ensureHook, getHook } from './utils'

/**
 * resolve 模块时，根据其 package.json 中申明的 miniprogram 字段添加路径
 */
export default class ModuleFieldDirPlugin {
  constructor(source, fieldName, defaultDir, target) {
    this.source = source
    this.fieldName = fieldName
    this.defaultDir = defaultDir
    this.target = target
  }

  apply(resolver) {
    const target = ensureHook(resolver, this.target)
    getHook(resolver, this.source).tapAsync('ModuleFieldDirPlugin', (request, resolveContext, callback) => {
      if (!request.descriptionFileRoot || path.join(request.descriptionFileRoot, request.relativePath) !== request.path)
        return callback()
      if (request.alreadyTriedMiniprogramField === request.descriptionFilePath) return callback()
      const pkgContent = request.descriptionFileData
      const filename = path.basename(request.descriptionFilePath)

      let miniprogramDistPath = pkgContent && pkgContent[this.fieldName]
      if (!miniprogramDistPath || typeof miniprogramDistPath !== 'string') miniprogramDistPath = this.defaultDir

      if (!miniprogramDistPath) return callback()

      const obj = Object.assign({}, request, {
        path: path.join(request.descriptionFileRoot, miniprogramDistPath),
        request: request.relativePath,
        alreadyTriedMiniprogramField: request.descriptionFilePath,
      })
      return resolver.doResolve(
        target,
        obj,
        'use ' + miniprogramDistPath + ' from ' + this.fieldName + ' in ' + filename,
        resolveContext,
        callback,
      )
    })
  }
}
