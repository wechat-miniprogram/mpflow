module.exports = function () {
  const exportModule = {
    imports: [],
    moduleId: null,
    url: null,
    outputPath: null,
    exports: null,
  }

  /**
   * 添加子模块
   */
  exportModule.i = function (importModule) {
    for (const imported of importModule.imports) {
      this.imports.push(imported)
    }
    this.imports.push([importModule.moduleId, importModule.exports, importModule.url, importModule.outputPath ])
  }

  /**
   * 处理 urls
   */
  exportModule.u = function (url) {
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

  return exportModule
}
