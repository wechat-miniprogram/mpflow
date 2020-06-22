import loaderUtils from 'loader-utils'
import ConfigDependency from '../ConfigDependency'
import { evalModuleBundleCode, asyncLoaderWrapper } from './utils'

const loaderName = 'asset-loader'

/**
 * @type {import('webpack').loader.Loader}
 */
const assetLoader = source => source
export default assetLoader

export const pitch = asyncLoaderWrapper(async function pitch(request) {
  const options = loaderUtils.getOptions(this) || {}
  const { type } = options

  // 获取到真实的文件内容
  if (type === 'config') {
    const moduleContent = await evalModuleBundleCode(loaderName, this)
    const content = JSON.stringify(moduleContent, null, 2)
    this._module.addDependency(new ConfigDependency(request, this.context, content))
    return content
  }

  return
})
