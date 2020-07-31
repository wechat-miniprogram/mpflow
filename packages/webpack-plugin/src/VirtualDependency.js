import ModuleDependency from 'webpack/lib/dependencies/ModuleDependency'

class VirtualDependency extends ModuleDependency {
  /**
   * @param {string} request request path for entry
   */
  constructor(request) {
    super(request)
  }

  get type() {
    return 'virtual'
  }
}

class VirtualDependencyTemplate {
  apply() {
    // do nothing
  }
}
VirtualDependency.Template = VirtualDependencyTemplate

export default VirtualDependency
