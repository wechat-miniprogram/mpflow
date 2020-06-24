import path from 'path'
import { getOptions, stringifyRequest, isUrlRequest, urlToRequest, interpolateName } from 'loader-utils'
import * as parser from './wxml-parser'

/**
 * @typedef PluginImportMessage
 * @prop {string} pluginName
 * @prop {'import'} type
 * @prop {object} value
 * @prop {string} value.importName
 * @prop {string} value.url
 */

/**
 * @typedef PluginChildImportMessage
 * @prop {string} pluginName
 * @prop {'child-import'} type
 * @prop {object} value
 * @prop {string} value.importName
 */

/**
 * @typedef PluginReplaceMessage
 * @prop {string} pluginName
 * @prop {'replacer'} type
 * @prop {object} value
 * @prop {string} value.pattern
 * @prop {string} value.target
 * @prop {string} value.replacementName
 */

/**
 * @typedef {PluginImportMessage | PluginChildImportMessage | PluginReplaceMessage} PluginMessage
 */

/**
 * @typedef PluginContext
 * @prop {PluginMessage[]} messages
 */

/**
 * @typedef {(ast: any, context: PluginContext)} Plugin
 */

/**
 * @param {Plugin[]} plugins
 */
function pluginRunner(plugins) {
  return {
    process: ast => {
      /** @type {PluginContext} */
      const context = { messages: [] }

      for (const plugin of plugins) {
        plugin(ast, context)
      }

      return context
    },
  }
}

function getImportCode(loaderContext, imports, esModule) {
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

function getModuleCode(ast, childImports, replacers, url, outputPath, esModule) {
  let code = JSON.stringify(parser.codegen(ast))
  let beforeCode = ''

  beforeCode += esModule
    ? `var exports = ___WXML_LOADER_API_IMPORT___();\n`
    : `exports = ___WXML_LOADER_API_IMPORT___();\n`

  for (const item of childImports) {
    const { importName } = item

    beforeCode += `exports.i(${importName});\n`
  }

  for (const item of replacers) {
    const { pattern, replacementName, target } = item

    beforeCode += `var ${replacementName} = ${target};\n`

    code = code.replace(pattern, () => `" + ${replacementName} + "`)
  }

  beforeCode += 'exports.moduleId = module.id;\n'
  beforeCode += `exports.url = ${url};\n`
  beforeCode += `exports.outputPath = ${outputPath};\n`

  return `${beforeCode}\nexports.exports = ${code};\n`
}

function getExportCode(esModule) {
  return esModule ? 'export default exports;\n' : 'module.exports = exports;\n'
}

const importAttributes = [
  {
    tag: 'import',
    attribute: 'src',
    importChild: true,
  },
  {
    tag: 'include',
    attribute: 'src',
    importChild: true,
  },
  {
    tag: 'image',
    attribute: 'src',
  },
]

function importPlugin(attributes) {
  const tagAttrMap = new Map()

  for (const item of attributes) {
    const attrSet = tagAttrMap.get(item.tag) || new Map()
    attrSet.set(item.attribute, item)
    tagAttrMap.set(item.tag, attrSet)
  }

  const findAttribute = elem => {
    if (elem.type !== 'element') return

    const attrSet = tagAttrMap.get(elem.tagName.val)

    if (!attrSet) return

    for (const attr of elem.attrs) {
      const name = attr.name.val
      if (attrSet.has(name) && attr.value) return { attr, option: attrSet.get(name) }
    }
  }

  const importsMap = new Map()
  const replacementMap = new Map()

  return (ast, context) => {
    parser.walk(ast, {
      begin(elem) {
        const result = findAttribute(elem)

        if (!result) return

        const { attr, option } = result

        if (!isUrlRequest(attr.value.val)) return

        const importKey = urlToRequest(decodeURIComponent(attr.value.val))
        let importName = importsMap.get(importKey)

        if (!importName) {
          importName = `___WXML_LOADER_IMPORT_${importsMap.size}___`
          importsMap.set(importKey, importName)

          context.messages.push({
            type: 'import',
            value: {
              importName,
              url: importKey,
            },
          })
        }

        // 是否作为子组件导入
        if (option.importChild) {
          context.messages.push({
            type: 'child-import',
            value: {
              importName,
            },
          })
        }

        const replacementKey = importKey
        let placeholderName = replacementMap.get(replacementKey)

        if (!placeholderName) {
          placeholderName = `___WXML_LOADER_PLACEHOLDER_${replacementMap.size}___`
          const replacementName = `___WXML_LOADER_REPLACEMENT_${replacementMap.size}___`
          replacementMap.set(replacementKey, placeholderName)

          context.messages.push({
            type: 'replacer',
            value: {
              pattern: new RegExp(placeholderName, 'g'),
              target: `exports.u(${importName});`,
              replacementName,
            },
          })
        }

        // 将 ast 中的 src 替换
        attr.value.val = placeholderName
      },
    })
  }
}

/**
 * @type {import('webpack').loader.Loader}
 */
const wxmlLoader = function wxmlLoader(content) {
  const options = getOptions(this) || {}

  // const callback = this.async()

  const ast = parser.parse(content)

  const { messages } = pluginRunner([importPlugin(importAttributes)]).process(ast)

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
