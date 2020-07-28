import DescriptionFileUtils from 'enhanced-resolve/lib/DescriptionFileUtils'
import path from 'path'
import { ensureHook, getHook } from './utils'

/**
 * 向上查找 project.config.json 文件，使用其中的 miniprogramRoot 作为根路径
 */
export default class ProjectConfigFileRootPlugin {
  constructor(source, filename, fieldName, target) {
    this.source = source
    this.filename = filename
    this.fieldName = fieldName
    this.target = target
  }

  apply(resolver) {
    const target = ensureHook(resolver, this.target)
    getHook(resolver, this.source).tapAsync('ProjectConfigFileRootPlugin', (request, resolveContext, callback) => {
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
