import { getOptions, interpolateName, isUrlRequest, stringifyRequest } from 'loader-utils'
import path from 'path'
import postcss from 'postcss'
import { loader } from 'webpack'
import { importPlugin, urlPlugin } from './plugins'
import { PluginChildImportMessage, PluginImportMessage, PluginReplaceMessage } from './plugins/type'

class Warning extends Error {
  constructor(warning: postcss.Warning) {
    super(warning.toString())
    const { text, line, column } = warning
    this.name = 'Warning'

    // Based on https://github.com/postcss/postcss/blob/master/lib/warning.es6#L74
    // We don't need `plugin` properties.
    this.message = `${this.name}\n\n`

    if (typeof line !== 'undefined') {
      this.message += `(${line}:${column}) `
    }

    this.message += `${text}`

    // We don't need stack https://github.com/postcss/postcss/blob/master/docs/guidelines/runner.md#31-dont-show-js-stack-for-csssyntaxerror
    this.stack = undefined
  }
}

function getImportCode(
  loaderContext: loader.LoaderContext,
  imports: PluginImportMessage['value'][],
  esModule: boolean,
) {
  let code = ''

  const apiUrl = stringifyRequest(loaderContext, require.resolve('./runtime/api'))

  code += esModule
    ? `import ___WXSS_LOADER_API_IMPORT___ from ${apiUrl};\n`
    : `var ___WXSS_LOADER_API_IMPORT___ = require(${apiUrl})\n`

  for (const item of imports) {
    const { importName, url } = item
    const request = stringifyRequest(loaderContext, url)

    code += esModule ? `import ${importName} from ${request};\n` : `var ${importName} = require(${request});\n`
  }

  return code
}

function getModuleCode(
  result: postcss.Result,
  childImports: PluginChildImportMessage['value'][],
  replacers: PluginReplaceMessage['value'][],
  // url: string,
  // outputPath: string,
  esModule: boolean,
) {
  const { css } = result
  let content = JSON.stringify(css)
  let beforeCode = ''

  beforeCode += esModule
    ? `var exports = ___WXSS_LOADER_API_IMPORT___();\n`
    : `exports = ___WXSS_LOADER_API_IMPORT___();\n`

  for (const item of childImports) {
    const { importName } = item

    beforeCode += `exports.i(${importName});\n`
  }

  for (const item of replacers) {
    const { pattern, replacerName, target } = item

    beforeCode += `var ${replacerName} = ${target};\n`

    content = content.replace(pattern, () => `" + ${replacerName} + "`)
  }



  // beforeCode += 'exports.moduleId = module.id;\n'
  // beforeCode += `exports.url = ${url};\n`
  // beforeCode += `exports.outputPath = ${outputPath};\n`

  return `${beforeCode}\nexports.e(module.id, ${content});\n`
}

function getExportCode(esModule: boolean) {
  return esModule ? 'export default exports;\n' : 'module.exports = exports;\n'
}

const wxssLoader: loader.Loader = function wxssLoader(content) {
  const options: any = getOptions(this) || {}

  this.cacheable()

  const callback = this.async()!
  // const sourceMap = options.sourceMap || false

  postcss([
    importPlugin({
      filter: url => isUrlRequest(url, this.rootContext),
      // urlHandler: url => stringifyRequest(this, url),
    }),
    urlPlugin({
      filter: url => isUrlRequest(url, this.rootContext),
      // urlHandler: url => stringifyRequest(this, url),
    }),
  ])
    .process(content, {
      from: this.resourcePath,
      to: this.resourcePath,
    })
    .then(result => {
      for (const warning of result.warnings()) {
        this.emitWarning(new Warning(warning))
      }

      const imports: PluginImportMessage['value'][] = []
      const childImports: PluginChildImportMessage['value'][] = []
      const replacers: PluginReplaceMessage['value'][] = []

      for (const message of result.messages) {
        switch (message.type) {
          case 'import':
            imports.push(message.value)
            break
          case 'child-import':
            childImports.push(message.value)
            break
          case 'replacer':
            replacers.push(message.value)
            break
        }
      }

      // const context = options.context || this.rootContext

      // const url = interpolateName(this, options.name || '[name].[hash:8].[ext]', {
      //   context,
      //   content,
      //   regExp: options.regExp,
      // })

      // const outputPath = JSON.stringify(path.posix.join(options.outputPath || '', url))
      // const publicPath = `__webpack_public_path__ + ${outputPath}`

      const esModule = typeof options.esModule !== 'undefined' ? options.esModule : false

      const importCode = getImportCode(this, imports, esModule)
      const moduleCode = getModuleCode(result, childImports, replacers, /*publicPath, outputPath,*/ esModule)
      const exportCode = getExportCode(esModule)

      return callback(null, `${importCode}${moduleCode}${exportCode}`)
    })
    .catch(error => {
      if (error.file) {
        this.addDependency(error.file)
      }
      callback(error)
    })
}

export default wxssLoader
