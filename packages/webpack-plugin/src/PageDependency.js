import ModuleDependency from 'webpack/lib/dependencies/ModuleDependency'

class PageDependency extends ModuleDependency {
  constructor(request) {
    super(request)
  }

  getResourceIdentifier() {
    return `mp-page-module-${this.request}`
  }

  get type() {
    return 'mp page module'
  }
}

class PageDependencyTemplate {
  apply() {
    // do nothing
  }
}
PageDependency.Template = PageDependencyTemplate

export default PageDependency
