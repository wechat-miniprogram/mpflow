/**
 * 感谢 John Resig： https://johnresig.com/files/htmlparser.js
 */

// 正则声明
const startTagReg = /^<([-A-Za-z0-9_]+)((?:\s+[-A-Za-z0-9_:@.#]+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/i
const endTagReg = /^<\/([-A-Za-z0-9_]+)[^>]*>/i
const attrReg = /([-A-Za-z0-9_:@.#]+)(?:(\s*=\s*)(?:(?:(")((?:\\.|[^"])*)")|(?:(')((?:\\.|[^'])*)')|([^>\s]+)))?/g

// 空元素
const voidSet = new Set([])

// 可能包含任意内容的元素
const rawTextSet = new Set(['wxs'])

/**
 * @typedef {object} Position
 * @prop {number} start
 * @prop {number} end
 */

/**
 * @typedef {object} Attribute
 * @prop {{ val: string, pos: Position }} name
 * @prop {{ val: string, pos: Position }} [value]
 * @prop {Position} pos
 */

/**
 * 分词
 * @param {string} content
 * @param {object} handler
 * @param {(text: string, pos: Position) => void} [handler.text]
 * @param {(tagName: { val: string, pos: Position }, attrs: Attribute[], unary: boolean, pos: Position) => void} [handler.start]
 * @param {(tagName: { val: string, pos?: Position }, pos?: Position) => void} [handler.end]
 */
export function tokenize(content, handler) {
  const stack = []
  let last = content
  let start = 0

  stack.last = function () {
    return this[this.length - 1]
  }

  while (content) {
    let isText = true

    if (!stack.last() || !rawTextSet.has(stack.last())) {
      if (content.startsWith('<!--')) {
        // comment
        const index = content.indexOf('-->')

        if (index >= 0) {
          content = content.substring(index + 3)
          start += index + 3
          isText = false
        }
      } else if (content.startsWith('</')) {
        // end tag
        const match = content.match(endTagReg)

        if (match) {
          parseEndTag(match[0], match[1])
          content = content.substring(match[0].length)
          start += match[0].length
          isText = false
        }
      } else if (content.startsWith('<')) {
        // start tag
        let match = content.match(startTagReg)

        if (match) {
          parseStartTag(match[0], match[1], match[2], match[3])
          content = content.substring(match[0].length)
          start += match[0].length
          isText = false
        }
      }

      if (isText) {
        const index = content.indexOf('<')

        const text = index < 0 ? content : content.substring(0, index)
        const end = start + text.length

        if (handler.text) handler.text(text, { start, end })

        start = end
        content = content.substring(text.length)
      }
    } else {
      const execRes = new RegExp(`</${stack.last()}[^>]*>`).exec(content)

      if (execRes) {
        const text = content.substring(0, execRes.index)
        text.replace(/<!--(.*?)-->/g, '')
        const end = start + execRes.index + execRes[0].length

        if (text && handler.text) handler.text(text, { start, end: start + execRes.index })

        start = start + execRes.index
        parseEndTag(execRes[0], stack.last())

        start = end
        content = content.substring(execRes.index + execRes[0].length)
      }
    }

    if (content === last) throw new Error(`parse error: ${content}`)
    last = content
  }

  // 关闭栈内的标签
  parseEndTag()

  function parseStartTag(tag, tagName, rest, unary) {
    unary = voidSet.has(tagName) || !!unary

    if (!unary) stack.push(tagName)

    if (handler.start) {
      const attrs = []

      let match
      const attrsStart = start + tagName.length + 1
      // eslint-disable-next-line no-cond-assign
      while ((match = attrReg.exec(rest))) {
        const index = match.index
        const all = match[0]
        const nameStr = match[1]
        const equal = match[2]
        const quote = match[3] || match[5] || ''
        const valueStr = match[4] || match[6] || match[7]

        const nameStart = attrsStart + index
        const name = {
          val: nameStr,
          pos: { start: nameStart, end: nameStart + nameStr.length },
        }

        let value
        if (typeof valueStr === 'string') {
          const valueStart = nameStart + nameStr.length + equal.length + quote.length
          value = {
            val: valueStr,
            pos: { start: valueStart, end: valueStart + valueStr.length },
          }
        }

        attrs.push({
          name,
          value,
          pos: {
            start: attrsStart + index,
            end: attrsStart + index + all.length,
          },
        })
      }

      if (handler.start)
        handler.start(
          {
            val: tagName,
            pos: { start: start + 1, end: start + tagName.length + 1 },
          },
          attrs,
          unary,
          {
            start,
            end: start + tag.length,
          },
        )
    }
  }

  function parseEndTag(tag, tagName) {
    let pos

    if (!tagName) {
      pos = 0
    } else {
      // 找到同名的开始标签
      for (pos = stack.length - 1; pos >= 0; pos--) {
        if (stack[pos] === tagName) break
      }
    }

    if (pos >= 0) {
      if (handler.end) {
        // 关闭开始标签和结束标签中的所有标签
        for (let i = stack.length - 1; i > pos; i--) {
          handler.end({ val: stack[i] }, undefined)
        }

        // 关闭当前标签
        if (tag && tagName) {
          handler.end(
            {
              val: tagName,
              pos: {
                start: start + 2,
                end: start + tagName.length + 2,
              },
            },
            {
              start,
              end: start + tag.length,
            },
          )
        } else {
          handler.end({ val: tagName }, undefined)
        }
      }

      stack.length = pos
    }
  }
}

/**
 * @typedef {object} WxmlText
 * @prop {'text'} type
 * @prop {string} content
 * @prop {Position} pos
 */

/**
 * @typedef {object} WxmlElement
 * @prop {'element'} type
 * @prop {{ val: string, pos: Position }} tagName
 * @prop {Attribute[]} attrs
 * @prop {boolean} unary
 * @prop {Position} pos
 * @prop {(WxmlElement | WxmlText)[]} children
 */

/**
 * 解析
 * @param {string} wxml
 * @return {(WxmlElement | WxmlText)[]}
 */
export function parse(wxml) {
  const r = {
    children: [],
  }
  const stack = [r]

  stack.last = function () {
    return this[this.length - 1]
  }

  tokenize(wxml, {
    start(tagName, attrs, unary, pos) {
      const node = {
        type: 'element',
        tagName,
        attrs,
        unary,
        pos,
        children: [],
      }

      stack.last().children.push(node)

      if (!unary) {
        stack.push(node)
      }
    },
    end() {
      stack.pop()
    },
    text(content, pos) {
      content = content.trim()
      if (!content) return

      stack.last().children.push({
        type: 'text',
        content,
        pos,
      })
    },
  })

  return r.children
}

/**
 * 遍历
 * @param {(WxmlElement | WxmlText)[]} ast
 * @param {{ begin?: (elem: WxmlElement | WxmlText) => void, end?: (elem: WxmlElement | WxmlText) => void }} handler
 */
export function walk(ast, handler) {
  for (const elem of ast) {
    handler.begin && handler.begin(elem)
    if (elem.type === 'element') walk(elem.children, handler)
    handler.end && handler.end(elem)
  }
}

/**
 * 代码生成
 * @param {(WxmlElement | WxmlText)[]} ast
 * @return {string}
 */
export function codegen(ast) {
  let wxml = ''

  walk(ast, {
    begin: elem => {
      if (elem.type === 'text') {
        wxml += elem.content
      } else if (elem.type === 'element') {
        wxml += `<${elem.tagName.val}`
        for (const attr of elem.attrs) {
          wxml += ` ${attr.name.val}`
          if (attr.value) {
            wxml += `="${attr.value.val}"`
          }
        }
        wxml += elem.unary ? '/>' : '>'
      }
    },
    end: elem => {
      if (elem.type === 'element' && !elem.unary) {
        wxml += `</${elem.tagName.val}>`
      }
    },
  })

  return wxml
}
