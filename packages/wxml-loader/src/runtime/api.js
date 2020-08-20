/* istanbul ignore file */

class WxmlModule {
  constructor() {
    this.exports = []
    this.imported = new Set()
  }

  toString() {
    return this.exports
  }

  /**
   * 添加自身
   */
  e(moduleId, content, url, sourceMap) {
    if (!this.imported.has(moduleId)) {
      this.exports.push([moduleId, content, url, sourceMap])
      this.imported.add(moduleId)
    }
  }

  /**
   * 添加子模块
   */
  i(importModule) {
    importModule.exports.forEach(imported => {
      this.e(...imported)
    })
  }

  /**
   * 处理 inline
   */
  l(module) {
    return module.__esModule ? module.default : module
  }

  /**
   * 处理 url
   */
  u(url) {
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
