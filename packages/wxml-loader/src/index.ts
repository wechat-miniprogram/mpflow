import { getOptions, interpolateName, stringifyRequest } from 'loader-utils'
import path from 'path'
import validateOptions from 'schema-utils'
import { SourceMapGenerator, RawSourceMap } from 'source-map'
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
  result: {
    code: string
    map: SourceMapGenerator | undefined
  },
  childImports: PluginChildImportMessage['value'][],
  replacers: PluginReplaceMessage['value'][],
  url: string,
  esModule: boolean,
  sourceMap: boolean,
) {
  let content = JSON.stringify(result.code)
  const sourceMapContent = sourceMap && result.map ? result.map.toString() : ' undefined'
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

    content = content.replace(pattern, () => `" + ${replacementName} + "`)
  }

  beforeCode += `exports.url = ${url};\n`

  return `${beforeCode}\nexports.e(module.id, ${content}, ${url}, ${sourceMapContent});\n`
}

function getExportCode(esModule: boolean) {
  return esModule ? 'export default exports;\n' : 'module.exports = exports;\n'
}

export interface Options {
  context?: string
  name?: string
  outputPath?: string
  esModule?: boolean
  sourceMap?: boolean
}

const wxmlLoader: loader.Loader = function wxmlLoader(content, map) {
  this.async()
  ;(async (): Promise<[string | Buffer, RawSourceMap?]> => {
    const options: Options = getOptions(this) || {}

    validateOptions(
      {
        additionalProperties: false,
        properties: {
          sourceMap: {
            description: 'Enables/Disables generation of source maps',
            type: 'boolean',
          },
          esModule: {
            description: 'Use the ES modules syntax',
            type: 'boolean',
          },
          context: {
            description: 'A custom file context',
            type: 'string',
          },
          name: {
            description: 'The filename template for the target file(s)',
            type: 'string',
          },
          outputPath: {
            description: 'A filesystem path where the target file(s) will be placed',
            type: 'string',
          },
        },
      },
      options,
      {
        name: 'WXML Loader',
        baseDataPath: 'options',
      },
    )

    // const sourceMap = typeof options.sourceMap === 'boolean' ? options.sourceMap : this.sourceMap
    const sourceMap = false // do not generate sourceMap since wcc compiler don't recognize it

    const contentStr = typeof content === 'string' ? content : content.toString('utf8')
    const ast = parser.parse(this.resourcePath, contentStr)

    const { messages } = await pluginRunner([importPlugin()]).process(ast)

    const imports: PluginImportMessage['value'][] = []
    const childImports: PluginChildImportMessage['value'][] = []
    const replacers: PluginReplaceMessage['value'][] = []
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

    const result = parser.codegen(ast, {
      sourceMap,
      prevMap: sourceMap ? map : undefined,
      minimize: this.minimize,
    })

    if (sourceMap && result.map) {
      result.map.setSourceContent(this.resourcePath, contentStr)
    }

    const context = options.context || this.rootContext

    const url = interpolateName(this, options.name || '[name].[ext]', {
      context,
      content,
    })

    const outputPath = JSON.stringify(path.posix.join(options.outputPath || '', url))
    const publicPath = `__webpack_public_path__ + ${outputPath}`

    const esModule = typeof options.esModule !== 'undefined' ? options.esModule : false

    const importCode = getImportCode(this, imports, esModule)
    const moduleCode = getModuleCode(
      result,
      childImports,
      replacers,
      publicPath,
      esModule,
      sourceMap,
    )
    const exportCode = getExportCode(esModule)

    return [`${importCode}${moduleCode}${exportCode}`]
  })().then(
    ([content, sourceMap]: [string | Buffer, RawSourceMap?]) => {
      this.callback(null, content, sourceMap)
    },
    err => {
      this.callback(err)
    },
  )
}

export default wxmlLoader
