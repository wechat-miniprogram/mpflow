import webpack from 'webpack'

class VirtualDependency extends webpack.Dependency {
  /**
   * @param {string} request request path which needs resolving
   */
  constructor(request) {
    super()
    this.request = request
    this.userRequest = request
  }

  /**
   * @returns {string | null} an identifier to merge equal requests
   */
  getResourceIdentifier() {
    return `virtual${this.request}`
  }

  serialize(context) {
    const { write } = context
    write(this.request)
    write(this.userRequest)
    write(this.range)
    super.serialize(context)
  }

  deserialize(context) {
    const { read } = context
    this.request = read()
    this.userRequest = read()
    this.range = read()
    super.deserialize(context)
  }
}

class VirtualDependencyTemplate {
  apply() {
    // do nothing
  }
}
VirtualDependency.Template = VirtualDependencyTemplate

webpack.util.serialization.register(VirtualDependency, '@mpflow/webpack-plugin/lib/VirtualDependency')

export default VirtualDependency
