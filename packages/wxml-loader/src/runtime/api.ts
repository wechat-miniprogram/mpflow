class WxmlModule {
  imports: [string, string, string, string][]
  moduleId: string
  url: string
  outputPath: string
  exports: string

  constructor() {
    this.imports = []
  }

  /**
   * 添加子模块
   */
  i(importModule: WxmlModule) {
    for (const imported of importModule.imports) {
      this.imports.push(imported)
    }
    this.imports.push([importModule.moduleId, importModule.exports, importModule.url, importModule.outputPath])
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
      return url.url
    }

    // If url is already wrapped in quotes, remove them
    if (/^['"].*['"]$/.test(url)) {
      url = url.slice(1, -1)
    }

    return url
  }
}

module.exports = () => new WxmlModule()
