/**
 * 感谢 John Resig： https://johnresig.com/files/htmlparser.js
 */

// 正则声明
const startTagReg = /^<([-A-Za-z0-9_]+)((?:\s+[-A-Za-z0-9_:@.#]+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/i
const endTagReg = /^<\/([-A-Za-z0-9_]+)[^>]*>/i
const attrReg = /^([-A-Za-z0-9_:@.#]+)(?:(\s*=\s*)(?:(?:(")((?:\\.|[^"])*)")|(?:(')((?:\\.|[^'])*)')|([^>\s]+)))?/i
const commentReg = /^<!--([\s\S]*?)-->/
const spaceReg = /^\s*/
const textReg = /^[^<]+/

// 空元素
const voidSet: Set<string> = new Set([])

// 可能包含任意内容的元素
const rawTextSet: Set<string> = new Set(['wxs'])

interface Position {
  start: number
  end: number
}

class Stack<T> extends Array<T> {
  constructor(arr: T[] = []) {
    super(...arr)
  }

  top() {
    return this[this.length - 1]
  }
}

interface TextToken {
  type: 'text'
  text: string
  pos: Position
}

interface CommentToken {
  type: 'comment'
  content: {
    val: string
    pos: Position
  }
  pos: Position
}

interface AttributeToken {
  type: 'attribute'
  name: {
    val: string
    pos: Position
  }
  value?: {
    val: string
    pos: Position
  }
  pos: Position
}

interface StartTagToken {
  type: 'startTag'
  tagName: {
    val: string
    pos: Position
  }
  attrs: AttributeToken[]
  unary: boolean
  pos: Position
}

interface EndTagToken {
  type: 'endTag'
  tagName: {
    val: string
    pos: Position
  }
  pos: Position
}

type Token = TextToken | CommentToken | StartTagToken | EndTagToken

function tokenizeComment(content: string, start: number, tokens: Token[]) {
  const match = content.match(commentReg)

  if (!match) return

  const all = match[0]
  const text = match[1]

  tokens.push({
    type: 'comment',
    content: {
      val: text,
      pos: {
        start: start + 4,
        end: start + 4 + text.length,
      },
    },
    pos: {
      start,
      end: start + all.length,
    },
  })

  return all.length
}

function tokenizeRawText(tagName: string, content: string, start: number, tokens: Token[]) {
  const match = content.match(new RegExp(`^(?:[^<]+|(?:<(?!/${tagName}[^>]*>)))+`))

  if (!match) return

  const text = match[0]

  tokens.push({
    type: 'text',
    text,
    pos: { start, end: start + text.length },
  })

  return text.length
}

function tokenizeRawTextEndTag(tagName: string, content: string, start: number, tokens: Token[]) {
  const match = content.match(new RegExp(`^</${tagName}[^>]*>`))

  if (!match) return

  const all = match[0]

  tokens.push({
    type: 'endTag',
    tagName: {
      val: tagName,
      pos: {
        start: start + 2,
        end: start + 2 + tagName.length,
      },
    },
    pos: {
      start,
      end: start + all.length,
    },
  })

  return all.length
}

function tokenizeEndTag(content: string, start: number, tokens: Token[]) {
  const match = content.match(endTagReg)

  if (!match) return

  const all = match[0]
  const tagName = match[1]

  tokens.push({
    type: 'endTag',
    tagName: {
      val: tagName,
      pos: {
        start: start + 2,
        end: start + 2 + tagName.length,
      },
    },
    pos: {
      start,
      end: start + all.length,
    },
  })

  return all.length
}

function tokenizeStartTag(content: string, start: number, tokens: Token[]) {
  const match = content.match(startTagReg)

  if (!match) return

  const all = match[0]
  const tagName = match[1]
  const attrString = match[2]
  const unary = voidSet.has(tagName) || !!match[3]

  const attrs = tokenizeAttrs(attrString, start + 1 + tagName.length)

  tokens.push({
    type: 'startTag',
    tagName: {
      val: tagName,
      pos: {
        start: start + 1,
        end: start + 1 + tagName.length,
      },
    },
    attrs,
    unary,
    pos: {
      start,
      end: start + all.length,
    },
  })

  return all.length
}

function tokenizeText(content: string, start: number, tokens: Token[]) {
  const match = content.match(textReg)

  if (!match) return

  const text = match[0]

  tokens.push({
    type: 'text',
    text,
    pos: { start, end: start + text.length },
  })

  return text.length
}

function tokenizeAttr(content: string, start: number, tokens: AttributeToken[]) {
  const match = content.match(attrReg)

  if (!match) return

  const all = match[0]
  const nameStr = match[1]
  const equal = match[2]
  const quote = match[3] || match[5] || ''
  const valueStr = match[4] || match[6] || match[7]

  const name: AttributeToken['name'] = {
    val: nameStr,
    pos: { start, end: start + nameStr.length },
  }

  let value: AttributeToken['value']
  if (typeof valueStr === 'string') {
    const valueStart = start + nameStr.length + equal.length + quote.length
    value = {
      val: valueStr,
      pos: { start: valueStart, end: valueStart + valueStr.length },
    }
  }

  tokens.push({
    type: 'attribute',
    name,
    value,
    pos: {
      start: start,
      end: start + all.length,
    },
  })

  return all.length
}

function tokenizeSpace(content: string, start: number, tokens: AttributeToken[]) {
  const match = content.match(spaceReg)

  if (!match) return

  return match[0].length
}

function tokenizeAttrs(content: string, start: number) {
  const tokens: AttributeToken[] = []

  while (content.length) {
    const offset = tokenizeAttr(content, start, tokens) || tokenizeSpace(content, start, tokens)

    if (!offset) {
      throw new Error('unexpected token ' + content)
    }

    start += offset
    content = content.substring(offset)
  }

  return tokens
}

/**
 * 分词
 */
export function tokenize(content: string): Token[] {
  const tokens: Token[] = []
  let start = 0

  while (content.length) {
    const lastToken = tokens[tokens.length - 1]

    let offset: number | undefined

    if (lastToken && lastToken.type === 'startTag' && rawTextSet.has(lastToken.tagName.val)) {
      // 如果是包含任意元素的 tag，则只解析 text 和自己的 end tag
      offset =
        tokenizeRawText(lastToken.tagName.val, content, start, tokens) ||
        tokenizeRawTextEndTag(lastToken.tagName.val, content, start, tokens)
    } else {
      offset =
        tokenizeComment(content, start, tokens) ||
        tokenizeEndTag(content, start, tokens) ||
        tokenizeStartTag(content, start, tokens) ||
        tokenizeText(content, start, tokens)
    }

    if (!offset) {
      throw new Error('unexpected token ' + content)
    }

    start += offset
    content = content.substring(offset)
  }

  return tokens
}

export type WxmlNode = WxmlText | WxmlComment | WxmlElement

interface WxmlText {
  type: 'text'
  token: TextToken
}

interface WxmlComment {
  type: 'comment'
  token: CommentToken
}

interface WxmlElement {
  type: 'element'
  startToken: StartTagToken
  endToken?: EndTagToken
  children: WxmlNode[]
}

/**
 * 解析
 */
export function parse(wxml: string): WxmlNode[] {
  const root = {
    type: 'root' as const,
    children: [] as WxmlNode[],
  }
  const stack = new Stack<WxmlElement | typeof root>([root])

  const tokens = tokenize(wxml)

  for (const token of tokens) {
    switch (token.type) {
      case 'startTag': {
        const elem: WxmlElement = {
          type: 'element',
          startToken: token,
          children: [],
        }
        stack.top().children.push(elem)
        if (!token.unary) stack.push(elem)
        break
      }
      case 'endTag': {
        let top = stack.top()
        // 关闭一个 tag 时，找到最近一个对应的 start tag
        while ((top = stack.top()) && top.type === 'element' && top.startToken.tagName.val !== token.tagName.val) {
          stack.pop()
        }

        if (top.type !== 'element') {
          // 没有找到对应的 start tag
          throw new Error('unexpected end tag ' + token.tagName.val)
        }

        top.endToken = token
        stack.pop()
        break
      }
      case 'comment': {
        stack.top().children.push({
          type: 'comment',
          token,
        })
        break
      }
      case 'text': {
        const text = token.text.trim()
        if (!text) break

        if (stack.top().type === 'root') {
          // 不能在根节点有 text
          throw new Error('unexpected text ' + token.text)
        }
        stack.top().children.push({
          type: 'text',
          token,
        })
        break
      }
    }
  }

  return root.children
}

/**
 * 遍历
 */
export function walk(
  ast: WxmlNode[],
  handler: {
    begin?: (elem: WxmlNode) => void
    end?: (elem: WxmlNode) => void
  },
) {
  for (const elem of ast) {
    handler.begin && handler.begin(elem)
    if (elem.type === 'element') walk(elem.children, handler)
    handler.end && handler.end(elem)
  }
}

/**
 * 代码生成
 */
export function codegen(ast: WxmlNode[]): string {
  let wxml = ''

  walk(ast, {
    begin: elem => {
      switch (elem.type) {
        case 'text':
          wxml += elem.token.text
          break
        case 'comment':
          wxml += '<!--'
          wxml += elem.token.content.val
          wxml += '-->'
          break
        case 'element':
          wxml += '<'
          wxml += elem.startToken.tagName.val
          for (const attr of elem.startToken.attrs) {
            wxml += ` ${attr.name.val}`
            if (attr.value) {
              wxml += `="${attr.value.val}"`
            }
          }
          wxml += elem.startToken.unary ? '/>' : '>'
          break
      }
    },
    end: elem => {
      switch (elem.type) {
        case 'element':
          if (!elem.startToken.unary) {
            wxml += `</${elem.startToken.tagName.val}>`
          }
          break
      }
    },
  })

  return wxml
}
