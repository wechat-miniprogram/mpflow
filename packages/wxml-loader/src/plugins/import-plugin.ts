import { isUrlRequest, urlToRequest } from 'loader-utils'
import * as parser from '../wxml-parser'
import { Plugin } from './type'

export interface ImportAttributes {
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

const PLUGIN_NAME = 'wxml import plugin'

export default function importPlugin(attributes: ImportAttributes[] = defaultImportAttributes): Plugin {
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
      if (attrSet.has(name) && attr.value) return { attr, option: attrSet.get(name) }
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
