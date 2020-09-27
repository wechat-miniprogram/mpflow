import { getOptions, stringifyRequest } from 'loader-utils'
import path from 'path'
import { asyncLoaderWrapper, markAsExternal } from '../utils'

/**
 * @type {import('webpack').loader.Loader}
 */
export const pitch = asyncLoaderWrapper(async function (remainRequest) {
  const options = getOptions(this) || {}
  const outputPath = options.outputPath || path.basename(this.resourcePath)

  this.cacheable()

  markAsExternal(this._module, 'lib', outputPath)

  return `module.exports = require(${stringifyRequest(this, '!!' + remainRequest)})`
})
