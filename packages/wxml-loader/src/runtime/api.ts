class WxmlModule {
  imports: [string, string, string][]
  moduleId: string
  exports: string
  url: string

  constructor() {
    this.imports = []
  }

  toString() {
    return this.exports
  }

  /**
   * 处理引用
   * @param module
   */
  i(module: WxmlModule) {
    module.imports.forEach(imported => {
      this.imports.push(imported)
    })
    this.imports.push([module.moduleId, module.exports, module.url])
  }

  /**
   * 处理 inline
   */
  l(module: any) {
    return module.__esModule ? module.default : module
  }

  /**
   * 处理 url
   */
  u(url: any) {
    url = url && url.__esModule ? url.default : url

    if (typeof url === 'object' && url.url !== undefined) {
      url = url.url
    }

    // If url is already wrapped in quotes, remove them
    if (/^['"].*['"]$/.test(url)) {
      url = url.slice(1, -1)
    }

    return url
  }
}

module.exports = () => new WxmlModule()
