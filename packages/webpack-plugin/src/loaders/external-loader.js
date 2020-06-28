import { getOptions } from 'loader-utils'
import { asyncLoaderWrapper } from './utils'
import VirtualDependency from '../VirtualDependency'

const externalLoader = source => source

export default externalLoader

/**
 * @type {import('webpack').loader.Loader['pitch']}
 */
export const pitch = asyncLoaderWrapper(async function (request) {
  const options = getOptions(this) || {}

  await new Promise((resolve, reject) => {
    this._compilation.addEntry(this.context, new VirtualDependency('-!' + request), options.name, err =>
      err ? reject(err) : resolve(),
    )
  })

  return `// external ${request}`
})
