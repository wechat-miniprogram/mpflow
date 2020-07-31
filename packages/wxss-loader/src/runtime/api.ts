class WxssModule {
  exports: [string, string][]

  constructor() {
    this.exports = []
  }

  toString() {
    return this.exports.map(([, content]) => content).join('\n')
  }

  /**
   * 添加自身
   */
  e(moduleId: string, content: string) {
    this.exports.push([moduleId, content])
  }

  /**
   * 添加子模块
   */
  i(importModule: WxssModule) {
    importModule.exports.forEach(imported => {
      this.exports.push(imported)
    })
  }

  /**
   * 处理 url
   */
  u(url: any, options: any = {}) {
    url = url && url.__esModule ? url.default : url

    if (typeof url === 'object' && url.url !== undefined) {
      return url.url
    }

    // If url is already wrapped in quotes, remove them
    if (/^['"].*['"]$/.test(url)) {
      url = url.slice(1, -1)
    }

    if (options.hash) {
      url += options.hash
    }

    return `"${url.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`
  }
}

module.exports = () => new WxssModule()
