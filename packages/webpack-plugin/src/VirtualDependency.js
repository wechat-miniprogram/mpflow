import ModuleDependency from 'webpack/lib/dependencies/ModuleDependency'

class VirtualDependency extends ModuleDependency {
  constructor(request) {
    super(request)
  }
}

export default VirtualDependency
