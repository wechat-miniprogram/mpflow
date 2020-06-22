import ModuleDependency from 'webpack/lib/dependencies/ModuleDependency'

class ConfigDependency extends ModuleDependency {
  constructor(request, context, content) {
    super(request)
    this.context = context
    this.content = content
  }

  getResourceIdentifier() {
    return `mp-config-module-${this.request}`
  }

  get type() {
    return 'mp config module'
  }
}

class ConfigDependencyTemplate {
  apply() {
    // do nothing
  }
}
ConfigDependency.Template = ConfigDependencyTemplate

export default ConfigDependency
