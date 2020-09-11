import { stringifyRequest } from 'loader-utils'
import { asyncLoaderWrapper } from '../utils'

/**
 * @type {import('webpack').loader.Loader}
 */
export const pitch = asyncLoaderWrapper(async function (remainRequest) {
  return `module.exports = require(${stringifyRequest(this, '!!' + remainRequest)})`
})

export default () => {}
