import { loader } from 'webpack'
import path from 'path'
import { getOptions, stringifyRequest, isUrlRequest, urlToRequest, interpolateName } from 'loader-utils'
import * as parser from './wxml-parser'

interface PluginImportMessage {
  pluginName: string
  type: 'import'
  value: {
    importName: string
    url: string
  }
}

interface PluginChildImportMessage {
  pluginName: string
  type: 'child-import'
  value: {
    importName: string
  }
}

interface PluginReplaceMessage {
  pluginName: string
  type: 'replacer'
  value: {
    pattern: string | RegExp
    target: string
    replacementName: string
  }
}

type PluginMessage = PluginImportMessage | PluginChildImportMessage | PluginReplaceMessage

interface PluginContext {
  messages: PluginMessage[]
}

interface Plugin {
  (ast: parser.WxmlNode[], context: PluginContext): void
}

function pluginRunner(plugins: Plugin[]) {
  return {
    process: (ast: parser.WxmlNode[]) => {
      const context: PluginContext = { messages: [] }

      for (const plugin of plugins) {
        plugin(ast, context)
      }

      return context
    },
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

function getExportCode(esModule: boolean) {
  return esModule ? 'export default exports;\n' : 'module.exports = exports;\n'
}

interface ImportAttributes {
  tag: string
  attribute: string
  importType?: 'child' | 'inline'
}

const defaultImportAttributes: ImportAttributes[] = [
  {
    tag: 'import',
    attribute: 'src',
    importType: 'child',
  },
  {
    tag: 'include',
    attribute: 'src',
    importType: 'child',
  },
  {
    tag: 'wxs',
    attribute: 'src',
    importType: 'inline',
  },
  {
    tag: 'image',
    attribute: 'src',
  },
]

function importPlugin(attributes: ImportAttributes[]): Plugin {
  const PLUGIN_NAME = 'importPlugin'

  const tagAttrMap = new Map<string, Map<string, ImportAttributes>>()

  for (const item of attributes) {
    const attrSet = tagAttrMap.get(item.tag) || new Map<string, ImportAttributes>()
    attrSet.set(item.attribute, item)
    tagAttrMap.set(item.tag, attrSet)
  }

  const findAttribute = (elem: parser.WxmlNode) => {
    if (elem.type !== 'element') return

    const attrSet = tagAttrMap.get(elem.startToken.tagName.val)

    if (!attrSet) return

    for (const attr of elem.startToken.attrs) {
      const name = attr.name.val
      if (attrSet.has(name) && attr.value) return { attr, option: attrSet.get(name)! }
    }
  }

  const importsMap = new Map()
  const replacementMap = new Map()
  const inlineReplacementMap = new Map()

  return (ast, context) => {
    parser.walk(ast, {
      begin(elem) {
        if (elem.type !== 'element') return

        const result = findAttribute(elem)

        if (!result) return

        const { attr, option } = result

        if (!attr.value || !isUrlRequest(attr.value.val)) return

        const importKey = urlToRequest(decodeURIComponent(attr.value.val))
        let importName = importsMap.get(importKey)

        if (!importName) {
          importName = `___WXML_LOADER_IMPORT_${importsMap.size}___`
          importsMap.set(importKey, importName)

          context.messages.push({
            type: 'import',
            pluginName: PLUGIN_NAME,
            value: {
              importName,
              url: importKey,
            },
          })
        }

        if (option.importType === 'inline') {
          // 是否作为内联内容导入

          const replacementKey = importKey
          let placeholderName: string = inlineReplacementMap.get(replacementKey)

          if (!placeholderName) {
            placeholderName = `___WXML_LOADER_INLINE_PLACEHOLDER_${replacementMap.size}___`
            const replacementName = `___WXML_LOADER_INLINE_REPLACEMENT_${replacementMap.size}___`
            inlineReplacementMap.set(replacementKey, placeholderName)

            context.messages.push({
              type: 'replacer',
              pluginName: PLUGIN_NAME,
              value: {
                pattern: new RegExp(placeholderName, 'g'),
                target: `exports.l(${importName});`,
                replacementName,
              },
            })
          }

          // 将 ast 中的 content 替换
          elem.children = [
            {
              type: 'text',
              token: { type: 'text', text: placeholderName },
            },
          ]
          // 删除对应 attr
          elem.startToken.attrs.splice(elem.startToken.attrs.findIndex(elemAttr => elemAttr === attr))
        } else {
          // 普通导入
          if (option.importType === 'child') {
            // 是否作为子组件导入
            context.messages.push({
              type: 'child-import',
              pluginName: PLUGIN_NAME,
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
              pluginName: PLUGIN_NAME,
              value: {
                pattern: new RegExp(placeholderName, 'g'),
                target: `exports.u(${importName});`,
                replacementName,
              },
            })
          }

          // 将 ast 中的 src 替换
          attr.value.val = placeholderName
        }
      },
    })
  }
}

const wxmlLoader: loader.Loader = function wxmlLoader(content) {
  const options: any = getOptions(this) || {}

  // const callback = this.async()

  const ast = parser.parse(typeof content === 'string' ? content : content.toString('utf8'))

  const { messages } = pluginRunner([importPlugin(defaultImportAttributes)]).process(ast)

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
