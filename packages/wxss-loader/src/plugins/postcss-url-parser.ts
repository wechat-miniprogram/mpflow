/**
 * https://github.com/webpack-contrib/css-loader/blob/master/src/plugins/postcss-url-parser.js
 */

import { plugin } from 'postcss'
import valueParser, { ParsedValue, Node, FunctionNode } from 'postcss-value-parser'

import { normalizeUrl } from '../utils'
import { PluginImportMessage, PluginReplaceMessage } from './type'

const pluginName = 'postcss-wxml-url-parser'

const isUrlFunc = /url/i
const isImageSetFunc = /^(?:-webkit-)?image-set$/i
const needParseDecl = /(?:url|(?:-webkit-)?image-set)\(/i

function getNodeFromUrlFunc(node: FunctionNode) {
  return node.nodes && node.nodes[0]
}

function walkUrls(
  parsed: ParsedValue,
  callback: (node: Node, url: string, needQuotes: boolean, isStringValue: boolean) => void,
) {
  parsed.walk(node => {
    if (node.type !== 'function') {
      return
    }

    if (isUrlFunc.test(node.value)) {
      const { nodes } = node
      const isStringValue = nodes.length !== 0 && nodes[0].type === 'string'
      const url = isStringValue ? nodes[0].value : valueParser.stringify(nodes)

      callback(getNodeFromUrlFunc(node), url, false, isStringValue)

      // Do not traverse inside `url`
      // eslint-disable-next-line consistent-return
      return false
    }

    if (isImageSetFunc.test(node.value)) {
      for (const nNode of node.nodes) {
        const { type, value } = nNode

        if (nNode.type === 'function' && isUrlFunc.test(value)) {
          const { nodes } = nNode

          const isStringValue = nodes.length !== 0 && nodes[0].type === 'string'
          const url = isStringValue ? nodes[0].value : valueParser.stringify(nodes)

          callback(getNodeFromUrlFunc(nNode), url, false, isStringValue)
        }

        if (type === 'string') {
          callback(nNode, value, true, true)
        }
      }

      // Do not traverse inside `image-set`
      // eslint-disable-next-line consistent-return
      return false
    }
  })
}

export default plugin(
  pluginName,
  (options: { filter?: (url: string) => boolean; urlHandler?: (url: string) => string }) => (css, result) => {
    const importsMap = new Map()
    const replacementsMap = new Map()

    css.walkDecls(decl => {
      if (!needParseDecl.test(decl.value)) {
        return
      }

      const parsed = valueParser(decl.value)

      walkUrls(parsed, (node, url, needQuotes, isStringValue) => {
        // https://www.w3.org/TR/css-syntax-3/#typedef-url-token
        if (url.replace(/^[\s]+|[\s]+$/g, '').length === 0) {
          result.warn(`Unable to find uri in '${decl ? decl.toString() : decl}'`, { node: decl })

          return
        }

        if (options.filter && !options.filter(url)) {
          return
        }

        const splittedUrl = url.split(/(\?)?#/)
        const [urlWithoutHash, singleQuery, hashValue] = splittedUrl
        const hash = singleQuery || hashValue ? `${singleQuery ? '?' : ''}${hashValue ? `#${hashValue}` : ''}` : ''

        const normalizedUrl = normalizeUrl(urlWithoutHash, isStringValue)

        const importKey = normalizedUrl
        let importName = importsMap.get(importKey)

        if (!importName) {
          importName = `___WXSS_LOADER_URL_IMPORT_${importsMap.size}___`
          importsMap.set(importKey, importName)

          const importMessage: PluginImportMessage = {
            type: 'import',
            plugin: pluginName,
            value: {
              importName,
              url: options.urlHandler ? options.urlHandler(normalizedUrl) : normalizedUrl,
            },
          }

          result.messages.push(importMessage)
        }

        const replacementKey = JSON.stringify({ importKey, hash })
        let replacementName = replacementsMap.get(replacementKey)

        if (!replacementName) {
          const replacerName = `___CSS_LOADER_URL_REPLACER_${replacementsMap.size}___`
          replacementName = `___CSS_LOADER_URL_PLACEHOLDER_${replacementsMap.size}___`
          replacementsMap.set(replacementKey, replacementName)

          const replaceMessage: PluginReplaceMessage = {
            type: 'replacer',
            plugin: pluginName,
            value: {
              pattern: new RegExp(replacementName, 'g'),
              target: `exports.u(${importName}, { hash: ${JSON.stringify(hash)} })`,
              replacerName,
            },
          }
        }

        node.type = 'word'
        node.value = replacementName
      })

      decl.value = parsed.toString()
    })
  },
)
