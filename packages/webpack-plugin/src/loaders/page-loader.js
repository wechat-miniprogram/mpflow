import { asyncLoaderWrapper } from './utils'

/**
 * @type {import('webpack').loader.Loader}
 */
const pageLoader = asyncLoaderWrapper(async function (source) {
  // TODO
  return source
})

export default pageLoader
