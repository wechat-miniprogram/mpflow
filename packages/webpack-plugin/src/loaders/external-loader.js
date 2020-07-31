import { getOptions } from 'loader-utils'
import SingleEntryDependency from 'webpack/lib/dependencies/SingleEntryDependency'
import { asyncLoaderWrapper } from '../utils'

const externalLoader = source => source

export default externalLoader

/**
 * @type {import('webpack').loader.Loader['pitch']}
 */
export const pitch = asyncLoaderWrapper(async function (request) {
  const options = getOptions(this) || {}

  // this.cacheable()

  this.addDependency(request)

  await new Promise((resolve, reject) => {
    const compilation = this._compilation
    this.compilation.addEntry(this.context, new SingleEntryDependency('!!' + request), String(this._compilation.entries.length), err =>
      err ? reject(err) : resolve(),
    )
  })

  return `// external ${request}`
})
