import ModuleDependency from 'webpack/lib/dependencies/ModuleDependency'

class ExternalDependency extends ModuleDependency {
  constructor(request, externalType, outputPath) {
    super(request)
    this.externalType = externalType
    this.outputPath = outputPath
  }

  get type() {
    return 'external entey'
  }
}

class ExternalDependencyTemplate {
  apply() {
    // do nothing
  }
}
ExternalDependency.Template = ExternalDependencyTemplate

export default ExternalDependency
