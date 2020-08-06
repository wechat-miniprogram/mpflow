/**
 * https://github.com/webpack-contrib/css-loader/blob/master/src/plugins/postcss-import-parser.js
 */

import { plugin } from 'postcss'
import valueParser from 'postcss-value-parser'
import { isUrlRequest } from 'loader-utils'
import { normalizeUrl } from '../utils'
import { PluginImportMessage, PluginChildImportMessage, PluginReplaceMessage } from './type'

const pluginName = 'wxss-import-parser'

export default plugin(
  pluginName,
  (options: { filter?: (url: string) => boolean; urlHandler?: (url: string) => string }) => (css, result) => {
    const placeholderMap = new Map()

    css.walkAtRules(/^import$/i, atRule => {
      // 只转换最顶层 @import
      if (atRule.parent.type !== 'root') return

      // Nodes do not exists - `@import url('http://') :root {}`
      /* istanbul ignore next */
      if (atRule.nodes) {
        result.warn("It looks like you didn't end your @import statement correctly. Child nodes are attached to it.", {
          node: atRule,
        })

        return
      }

      const { nodes } = valueParser(atRule.params)

      // No nodes - `@import ;`
      // Invalid type - `@import foo-bar;`
      /* istanbul ignore next */
      if (nodes.length === 0 || (nodes[0].type !== 'string' && nodes[0].type !== 'function')) {
        result.warn(`Unable to find uri in "${atRule.toString()}"`, {
          node: atRule,
        })

        return
      }

      let isStringValue = false
      let url = ''

      if (nodes[0].type === 'string') {
        isStringValue = true
        url = nodes[0].value
      } else if (nodes[0].type === 'function') {
        // Invalid function - `@import nourl(test.css);`
        /* istanbul ignore next */
        if (nodes[0].value.toLowerCase() !== 'url') {
          result.warn(`Unable to find uri in "${atRule.toString()}"`, {
            node: atRule,
          })

          return
        }

        isStringValue = nodes[0].nodes.length !== 0 && nodes[0].nodes[0].type === 'string'
        url = isStringValue ? nodes[0].nodes[0].value : valueParser.stringify(nodes[0].nodes)
      }

      // Empty url - `@import "";` or `@import url();`
      /* istanbul ignore next */
      if (url.trim().length === 0) {
        result.warn(`Unable to find uri in "${atRule.toString()}"`, {
          node: atRule,
        })

        return
      }

      const isRequestable = isUrlRequest(url)

      if (isRequestable) {
        url = normalizeUrl(url, isStringValue)

        // Empty url after normalize - `@import '\
        // \
        // \
        // ';
        /* istanbul ignore next */
        if (url.trim().length === 0) {
          result.warn(`Unable to find uri in "${atRule.toString()}"`, {
            node: atRule,
          })

          return
        }
      }

      // const media = valueParser.stringify(nodes.slice(1)).trim().toLowerCase()

      if (options.filter && !options.filter(url)) {
        return
      }

      atRule.remove()

      if (isRequestable) {
        const importKey = url
        let placeholderName = placeholderMap.get(importKey)

        if (!placeholderName) {
          const importName = `___WXSS_LOADER_AT_RULE_IMPORT_${placeholderMap.size}___`
          // const replacerName = `___WXSS_LOADER_AT_RULE_REPLACER_${placeholderMap.size}___`
          placeholderName = `___WXSS_LOADER_AT_RULE_PLACEHOLDER_${placeholderMap.size}___`
          placeholderMap.set(importKey, placeholderName)

          // var importName = require(url)
          const importMessage: PluginImportMessage = {
            type: 'import',
            plugin: pluginName,
            value: {
              importName,
              url: options.urlHandler ? options.urlHandler(url) : url,
            },
          }

          // exports.i(importName)
          const childImportMessage: PluginChildImportMessage = {
            type: 'child-import',
            plugin: pluginName,
            value: {
              importName,
            },
          }

          // // var replacerName = exports.u(importName)
          // // "@import url" => "@import " + replacerName + ""
          // const replacerMessage: PluginReplaceMessage = {
          //   type: 'replacer',
          //   plugin: pluginName,
          //   value: {
          //     pattern: new RegExp(placeholderName, 'g'),
          //     target: `exports.u(${importName})`,
          //     replacerName,
          //   },
          // }

          result.messages.push(importMessage, childImportMessage /*, replacerMessage*/)
        }

        // atRule.params = `"${placeholderName}"`
      }
    })
  },
)
