import { getOptions } from 'loader-utils'
import { asyncLoaderWrapper, evalModuleBundleCode, isRequest, resolveWithType } from '../utils'

const RAW_SYMBOL = Symbol('json raw')

const createRaw = value => ({
  [RAW_SYMBOL]: true,
  value,
})

const JsonStringify = value => {
  const stack = []
  let indent = ''
  const gap = '  '

  const serializeProperty = (key, holder) => {
    let value = holder[key]
    if (typeof value?.toJSON === 'function') {
      value = value.toJSON(key)
    }

    switch (value) {
      case null:
        return 'null'
      case true:
        return 'true'
      case false:
        return 'false'
    }

    switch (typeof value) {
      case 'string':
        return quoteString(value, false)
      case 'number':
        return String(value)
      case 'object':
        return value[RAW_SYMBOL] ? value.value : Array.isArray(value) ? serializeArray(value) : serializeObject(value)
    }

    return undefined
  }

  const quoteString = value => JSON.stringify(value)

  const serializeObject = value => {
    if (stack.indexOf(value) >= 0) {
      throw TypeError('Converting circular structure to JSON5')
    }

    stack.push(value)

    const stepback = indent
    indent = indent + gap

    const keys = Object.keys(value)
    const partial = []
    for (const key of keys) {
      const propertyString = serializeProperty(key, value)
      if (propertyString === undefined) continue

      const member = `${serializeKey(key)}: ${propertyString}`
      partial.push(member)
    }
    const final = partial.length ? `{\n${indent}${partial.join(',\n' + indent)}\n${stepback}}` : '{}'

    stack.pop()
    indent = stepback
    return final
  }

  const serializeKey = key => JSON.stringify(key)

  const serializeArray = value => {
    if (stack.indexOf(value) >= 0) {
      throw TypeError('Converting circular structure to JSON5')
    }

    stack.push(value)

    const stepback = indent
    indent = indent + gap

    const partial = []
    for (let i = 0; i < value.length; i++) {
      const propertyString = serializeProperty(String(i), value)
      partial.push(propertyString !== undefined ? propertyString : 'null')
    }

    const final = partial.length ? `[\n${indent}${partial.join(',\n' + indent)}\n${stepback}]` : '[]'

    stack.pop()
    indent = stepback
    return final
  }

  return serializeProperty('', { '': value })
}

/**
 * app-json-raw-loader 用于读取 app.json 的文件内容，并生成最终的 app.json 文件
 * 不负责收集 app.json 中的依赖
 */
export default asyncLoaderWrapper(async function (source) {
  const options = getOptions(this) || {}

  this.cacheable()

  const { exports: moduleContent } = await evalModuleBundleCode(this, source, this.resource)

  if (moduleContent.tabBar?.list) {
    // 处理 tabBar 的 icon 图片链接
    const list = moduleContent.tabBar.list

    for (const item of list) {
      for (const iconProp of ['iconPath', 'selectedIconPath']) {
        const rawRequest = item[iconProp]
        if (!rawRequest || !isRequest(iconProp)) continue
        const resolvedIconRequest = await resolveWithType(this, 'miniprogram/icon', item[iconProp])
        item[iconProp] = createRaw(`_interopRequireDefault(require(${JSON.stringify(resolvedIconRequest)})).default`)
      }
    }
  }

  if (moduleContent.tabBar?.custom) {
    moduleContent.tabBar.custom = true
  }

  if (typeof moduleContent.sitemapLocation === 'string') {
    moduleContent.sitemapLocation = 'sitemap.json'
  }

  if (typeof moduleContent.themeLocation === 'string') {
    moduleContent.themeLocation = 'theme.json'
  }

  return (
    'function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }\n' +
    'module.exports = ' +
    JsonStringify(moduleContent)
  )
})
