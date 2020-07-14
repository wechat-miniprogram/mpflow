import { getOptions, interpolateName, stringifyRequest } from 'loader-utils'
import path from 'path'
import { loader } from 'webpack'
import {
  importPlugin,
  PluginChildImportMessage,
  PluginImportMessage,
  PluginReplaceMessage,
  pluginRunner,
} from './plugins'
import * as parser from './wxml-parser'

function getImportCode(
  loaderContext: loader.LoaderContext,
  imports: PluginImportMessage['value'][],
  esModule: boolean,
) {
  let code = ''

  const apiUrl = stringifyRequest(loaderContext, require.resolve('./runtime/api'))

  code += esModule
    ? `import ___WXML_LOADER_API_IMPORT___ from ${apiUrl};\n`
    : `var ___WXML_LOADER_API_IMPORT___ = require(${apiUrl})\n`

  for (const item of imports) {
    const { importName, url } = item
    const request = stringifyRequest(loaderContext, url)

    code += esModule ? `import ${importName} from ${request};\n` : `var ${importName} = require(${request});\n`
  }

  return code
}

function getModuleCode(
  ast: parser.WxmlNode[],
  childImports: PluginChildImportMessage['value'][],
  replacers: PluginReplaceMessage['value'][],
  url: string,
  outputPath: string,
  esModule: boolean,
) {
  let code = JSON.stringify(parser.codegen(ast))
  let beforeCode = ''

  beforeCode += esModule
    ? `var exports = ___WXML_LOADER_API_IMPORT___();\n`
    : `exports = ___WXML_LOADER_API_IMPORT___();\n`

  // for (const item of childImports) {
  //   const { importName } = item

  //   beforeCode += `exports.i(${importName});\n`
  // }

  for (const item of replacers) {
    const { pattern, replacementName, target } = item

    beforeCode += `var ${replacementName} = ${target};\n`

    code = code.replace(pattern, () => `" + ${replacementName} + "`)
  }

  // beforeCode += 'exports.moduleId = module.id;\n'
  // beforeCode += `exports.url = ${url};\n`
  // beforeCode += `exports.outputPath = ${outputPath};\n`

  return `${beforeCode}\nexports.exports = ${code};\n`
}

function getExportCode(esModule: boolean) {
  return esModule ? 'export default exports;\n' : 'module.exports = exports;\n'
}

const wxmlLoader: loader.Loader = function wxmlLoader(content) {
  const options: any = getOptions(this) || {}

  // const callback = this.async()

  this.cacheable()

  const ast = parser.parse(typeof content === 'string' ? content : content.toString('utf8'))

  const { messages } = pluginRunner([importPlugin()]).process(ast)

  const imports = []
  const childImports = []
  const replacers = []
  for (const message of messages) {
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

  const context = options.context || this.rootContext

  const url = interpolateName(this, options.name || '[name].[hash:8].[ext]', {
    context,
    content,
    regExp: options.regExp,
  })

  const outputPath = JSON.stringify(path.posix.join(options.outputPath || '', url))
  const publicPath = `__webpack_public_path__ + ${outputPath}`

  const esModule = typeof options.esModule !== 'undefined' ? options.esModule : false

  const importCode = getImportCode(this, imports, esModule)
  const moduleCode = getModuleCode(ast, childImports, replacers, publicPath, outputPath, esModule)
  const exportCode = getExportCode(esModule)

  return `${importCode}${moduleCode}${exportCode}`
}

export default wxmlLoader
