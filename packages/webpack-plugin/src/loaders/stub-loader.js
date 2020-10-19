import { stringifyRequest } from 'loader-utils'
import { asyncLoaderWrapper } from '../utils'

/**
 * stub-loader 用于给声明的依赖插入一个转换桩，从而使 module 拥有相同的 id 而被优化
 * 如 !asset-loader!stub-loader!wxss-loader!app.wxss
 * 会和 !wxss-loader!app.wxss
 * 认为是相同的
 * @type {import('webpack').loader.Loader}
 */
export const pitch = asyncLoaderWrapper(async function (remainRequest) {
  return `module.exports = require(${stringifyRequest(this, '!!' + remainRequest)})`
})

export default () => {}
