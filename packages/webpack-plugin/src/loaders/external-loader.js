import { getOptions } from 'loader-utils'
import SingleEntryDependency from 'webpack/lib/dependencies/SingleEntryDependency'
import { asyncLoaderWrapper } from './utils'

const externalLoader = source => source

export default externalLoader

/**
 * @type {import('webpack').loader.Loader['pitch']}
 */
export const pitch = asyncLoaderWrapper(async function (request) {
  const options = getOptions(this) || {}

  this.addDependency(request)

  await new Promise((resolve, reject) => {
    this._compilation.addEntry(this.context, new SingleEntryDependency('!!' + request), options.name, err =>
      err ? reject(err) : resolve(),
    )
  })

  return `// external ${request}`
})
