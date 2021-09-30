import glob from 'fast-glob'
import type FS from 'fs'
import { urlToRequest } from 'loader-utils'
import path from 'path'
import * as parser from '../wxml-parser'
import { Plugin } from './type'

function isUrlRequest(url: string, root = false) {
  // An URL is not an request if

  // 1. It's an absolute url and it is not `windows` path like `C:\dir\file`
  if (/^[a-z][a-z0-9+.-]*:/i.test(url) && !path.win32.isAbsolute(url)) {
    return false
  }

  // 2. It's a protocol-relative
  if (/^\/\//.test(url)) {
    return false
  }

  // 3. It's some kind of url for a template
  // if (/^[{}[\]#*;,'§$%&(=?`´^°<>]/.test(url)) {
  //   return false
  // }

  // 4. It's also not an request if root isn't set and it's a root-relative url
  // if ((root === undefined || root === false) && /^\//.test(url)) {
  //   return false
  // }

  return true
}

/**
 * input: './context/pre'
 * context: './context'
 * prefix: './pre'
 */
const splitContextFromPrefix = (prefix: string) => {
  const idx = prefix.lastIndexOf(path.sep)
  let context = '.'
  if (idx >= 0) {
    context = prefix.substr(0, idx)
    prefix = `.${prefix.substr(idx)}`
  }
  return {
    context,
    prefix,
  }
}

/**
 * input: 'post?query'
 * postfix: 'post'
 * query: '?query'
 */
const splitQueryFromPostfix = (postfix: string) => {
  const idx = postfix.indexOf('?')
  let query = ''
  if (idx >= 0) {
    query = postfix.substr(idx)
    postfix = postfix.substr(0, idx)
  }
  return {
    postfix,
    query,
  }
}

/**
 * 判断一个 url 是否包含花括号
 * @param url
 */
function hasMustache(url: string): boolean {
  return /\{\{.*\}\}/.test(url)
}

function parseMustacheUrl(exp: string) {
  const expressions: { type: 'expression' | 'string'; value: string }[] = []

  let end = 0
  let start = exp.indexOf('{{', end)

  while (start >= 0) {
    // 花括号之前的模板字符串
    const str = exp.substring(end, start)
    if (str) expressions.push({ type: 'string', value: str })

    start += 2
    end = exp.indexOf('}}', start)

    if (end < 0) {
      throw new Error(`invalid expression "${exp}" at ${start}`)
    }

    // 花括号内的表达式
    const expression = exp.substring(start, end)
    if (expression) expressions.push({ type: 'expression', value: expression })

    end += 2
    start = exp.indexOf('{{', end)
  }

  if (end < exp.length) expressions.push({ type: 'string', value: exp.substring(end) })

  return expressions
}

function resolveMustacheUrl(fs: typeof FS, rootContext: string, url: string): string[] {
  const expressions = parseMustacheUrl(url)

  const prefixStr = expressions[0].type === 'string' ? expressions[0].value : ''
  const postfixStr =
    expressions[expressions.length - 1].type === 'string' ? expressions[expressions.length - 1].value : ''

  const { context, prefix } = splitContextFromPrefix(prefixStr)
  const { postfix, query } = splitQueryFromPostfix(postfixStr)

  const innerExpressions = expressions.slice(1, expressions.length - 1)
  const innerRexExp = innerExpressions.map(exp => (exp.type === 'string' ? exp.value : '.*')).join('')

  // Example: `./context/pre${e}inner${e}inner2${e}post?query`
  // context: "./context"
  // prefix: "./pre"
  // postfix: "post"
  // query: "?query"
  // regExp: /^\.\/pre.*inner.*inner2.*post$/
  const regExp = new RegExp(`^${prefix}${innerRexExp}${postfix}`)

  const filePaths = glob.sync('**/*', { onlyFiles: true, cwd: path.resolve(rootContext, context), fs })

  return filePaths
    .map(filePath => `./${filePath}`)
    .filter(filePath => regExp.test(filePath))
    .map(filePath => path.join(context, filePath + query))
}

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
  },
  {
    tag: 'image',
    attribute: 'src',
  },
]

export interface ImportPluginOptions {
  resolveMustache?: boolean
  attributes?: ImportAttributes[]
}

const PLUGIN_NAME = 'wxml import plugin'

export default function importPlugin(options: ImportPluginOptions = {}): Plugin {
  const { attributes, resolveMustache } = {
    attributes: defaultImportAttributes,
    ...options,
  }

  const tagAttrMap = new Map<string, Map<string, ImportAttributes>>()

  for (const item of attributes) {
    const attrSet = tagAttrMap.get(item.tag) || new Map<string, ImportAttributes>()
    attrSet.set(item.attribute, item)
    tagAttrMap.set(item.tag, attrSet)
  }

  const findAttribute = (elem: parser.WxmlNode) => {
    if (elem.type !== 'element') return

    const attrSet = tagAttrMap.get(elem.tag)

    if (!attrSet) return

    for (const attr of elem.attrs) {
      const name = attr.name
      if (attrSet.has(name) && attr.value) return { attr, option: attrSet.get(name)! }
    }
  }

  const importsMap = new Map<string, string>()
  const replacementMap = new Map<string, string>()
  const mustacheImportsMap = new Map<string, string>()
  // const inlineReplacementMap = new Map<string, string>()
  const wxsMap = new Map<string, string>()

  return (ast, context) => {
    /**
     * 增加一个 import 导入
     */
    const getImportName = (url: string) => {
      let importName = importsMap.get(url)

      if (!importName) {
        importName = `___WXML_LOADER_IMPORT_${importsMap.size}___`
        importsMap.set(url, importName)

        context.messages.push({
          type: 'import',
          pluginName: PLUGIN_NAME,
          value: {
            importName,
            url: url,
          },
        })
      }

      return importName
    }

    /**
     * 增加一个转换，将返回的 placeholder 插入到 wxml 中，最终会被替换为 target
     * @param target
     */
    const getPlaceholderName = (target: string) => {
      const replacementKey = target
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
            target,
            replacementName,
          },
        })
      }

      return placeholderName
    }

    const getWxsModuleName = (path: parser.WxmlPath, content: string) => {
      let wxsModuleName = wxsMap.get(content)

      if (!wxsModuleName) {
        wxsModuleName = `___WXML_LOADER_WXS_${wxsMap.size}___`
        wxsMap.set(content, wxsModuleName)

        path.insertBefore({
          type: 'element',
          tag: 'wxs',
          attrs: [
            {
              name: 'module',
              value: wxsModuleName,
            },
          ],
          children: [
            {
              type: 'text',
              raw: true,
              text: content,
            },
          ],
        })
      }

      return wxsModuleName
    }

    const getMustacheImportName = (wxmlPath: parser.WxmlPath, mustacheUrl: string) => {
      let importName = mustacheImportsMap.get(mustacheUrl)

      if (!importName) {
        // 获取所有可能的文件路径
        const importKeys = resolveMustacheUrl(context.fs, context.context, mustacheUrl).map(importUrl =>
          urlToRequest(importUrl),
        )
        const importNames = importKeys
          .map(importKey => `"${importKey}":exports.u(${getImportName(importKey)})`)
          .join(',')

        const placeholder = getPlaceholderName(`JSON.stringify({${importNames}})`)

        const wxsModuleName = getWxsModuleName(wxmlPath, `module.exports=${placeholder}`)

        let normalizedMustachUrl = path.normalize(mustacheUrl)
        if (!['.', '/'].includes(normalizedMustachUrl[0])) normalizedMustachUrl = './' + normalizedMustachUrl

        importName = JSON.stringify(
          `{{${wxsModuleName}['${normalizedMustachUrl.replace(/\{\{/g, "'+").replace(/\}\}/g, "+'")}']}}`,
        )
      }

      return importName
    }

    parser.walk(ast, {
      begin(path) {
        const node = path.node
        if (node.type !== 'element') return

        const result = findAttribute(node)

        if (!result) return

        const { attr, option } = result

        if (!attr.value || !isUrlRequest(attr.value)) return

        const url = decodeURIComponent(attr.value)
        const isMustacheUrl = hasMustache(url)

        // 跳过带 {{ }} 花括号的 url
        if (!resolveMustache && isMustacheUrl) return

        const importKey = urlToRequest(url, '')
        let importName: string

        if (isMustacheUrl) {
          // 如果 url 中包含花括号
          importName = getMustacheImportName(path, url)
        } else {
          // url 没有花括号，直接作为单个引用处理
          importName = getImportName(importKey)
        }

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

        if (option.importType === 'inline') {
          // 是否作为内联内容导入

          const placeholderName = getPlaceholderName(`exports.l(${importName},${isMustacheUrl})`)

          // 将 ast 中的 content 替换
          node.children = [
            {
              type: 'text',
              raw: true,
              text: placeholderName,
            },
          ]
          // 删除对应 attr
          node.attrs.splice(node.attrs.findIndex(elemAttr => elemAttr === attr))
        } else {
          // 普通导入
          const placeholderName = getPlaceholderName(`exports.u(${importName},${isMustacheUrl})`)

          // 将 ast 中的 src 替换
          attr.value = placeholderName
        }
      },
    })
  }
}
