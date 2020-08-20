import { SourceNode, SourceMapGenerator, SourceMapConsumer } from 'source-map'

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
  line: number
  column: number
  file: string
  source: string
}

type PositionMapper = (start: number, length: number) => Position

function getPositionMapper(fileName: string, content: string): PositionMapper {
  const lines: number[] = [] // lins[i] 代表 i 位置对应行号
  const columns: number[] = [] // column[i] 代表 i 位置对应行的起始列号

  let col = 0
  let lin = 1
  const l = content.length
  for (let i = 0; i < l; ++i) {
    lines[i] = lin
    columns[i] = col
    if (content[i] === '\n') {
      lin += 1
      col = i + 1
    }
  }

  return (start, length) => {
    return {
      line: lines[start],
      column: start - columns[start],
      file: fileName,
      source: content.substr(start, length),
    }
  }
}

function posToSourceNode(pos: Position | undefined, chunks: string | SourceNode | (string | SourceNode)[] = []): any {
  return pos
    ? new SourceNode(pos.line, pos.column, pos.file, chunks as any)
    : new SourceNode(null as any, null as any, null as any, chunks as any)
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
  raw: boolean
  text: string
  pos?: Position
}

interface CommentToken {
  type: 'comment'
  content: {
    val: string
    pos?: Position
  }
  pos?: Position
}

interface AttributeToken {
  type: 'attribute'
  name: {
    val: string
    pos?: Position
  }
  value?: {
    val: string
    pos?: Position
  }
  pos?: Position
}

interface StartTagToken {
  type: 'startTag'
  tag: {
    val: string
    pos?: Position
  }
  attrs: AttributeToken[]
  unary: boolean
  pos?: Position
}

interface EndTagToken {
  type: 'endTag'
  tag: {
    val: string
    pos?: Position
  }
  pos?: Position
}

type Token = TextToken | CommentToken | StartTagToken | EndTagToken

function tokenizeComment(content: string, start: number, tokens: Token[], positionMapper: PositionMapper) {
  const match = content.match(commentReg)

  if (!match) return

  const all = match[0]
  const text = match[1]

  tokens.push({
    type: 'comment',
    content: {
      val: text,
      pos: positionMapper(start + 4, text.length),
    },
    pos: positionMapper(start, all.length),
  })

  return all.length
}

function tokenizeRawText(
  tagName: string,
  content: string,
  start: number,
  tokens: Token[],
  positionMapper: PositionMapper,
) {
  const match = content.match(new RegExp(`^(?:[^<]+|(?:<(?!/${tagName}[^>]*>)))+`))

  if (!match) return

  const text = match[0]

  tokens.push({
    type: 'text',
    raw: true,
    text,
    pos: positionMapper(start, text.length),
  })

  return text.length
}

function tokenizeRawTextEndTag(
  tagName: string,
  content: string,
  start: number,
  tokens: Token[],
  positionMapper: PositionMapper,
) {
  const match = content.match(new RegExp(`^</${tagName}[^>]*>`))

  if (!match) return

  const all = match[0]

  tokens.push({
    type: 'endTag',
    tag: {
      val: tagName,
      pos: positionMapper(start + 2, tagName.length),
    },
    pos: positionMapper(start, all.length),
  })

  return all.length
}

function tokenizeEndTag(content: string, start: number, tokens: Token[], positionMapper: PositionMapper) {
  const match = content.match(endTagReg)

  if (!match) return

  const all = match[0]
  const tagName = match[1]

  tokens.push({
    type: 'endTag',
    tag: {
      val: tagName,
      pos: positionMapper(start + 2, tagName.length),
    },
    pos: positionMapper(start, all.length),
  })

  return all.length
}

function tokenizeStartTag(content: string, start: number, tokens: Token[], positionMapper: PositionMapper) {
  const match = content.match(startTagReg)

  if (!match) return

  const all = match[0]
  const tagName = match[1]
  const attrString = match[2]
  const unary = voidSet.has(tagName) || !!match[3]

  const attrs = tokenizeAttrs(attrString, start + 1 + tagName.length, positionMapper)

  tokens.push({
    type: 'startTag',
    tag: {
      val: tagName,
      pos: positionMapper(start + 1, tagName.length),
    },
    attrs,
    unary,
    pos: positionMapper(start, all.length),
  })

  return all.length
}

function tokenizeText(content: string, start: number, tokens: Token[], positionMapper: PositionMapper) {
  const match = content.match(textReg)

  if (!match) return

  const text = match[0]

  tokens.push({
    type: 'text',
    raw: false,
    text,
    pos: positionMapper(start, text.length),
  })

  return text.length
}

function tokenizeAttr(content: string, start: number, tokens: AttributeToken[], positionMapper: PositionMapper) {
  const match = content.match(attrReg)

  if (!match) return

  const all = match[0]
  const nameStr = match[1]
  const equal = match[2]
  const quote = match[3] || match[5] || ''
  const valueStr = match[4] || match[6] || match[7]

  const name: AttributeToken['name'] = {
    val: nameStr,
    pos: positionMapper(start, nameStr.length),
  }

  let value: AttributeToken['value']
  if (typeof valueStr === 'string') {
    const valueStart = start + nameStr.length + equal.length + quote.length
    value = {
      val: valueStr,
      pos: positionMapper(valueStart, valueStr.length),
    }
  }

  tokens.push({
    type: 'attribute',
    name,
    value,
    pos: positionMapper(start, all.length),
  })

  return all.length
}

function tokenizeSpace(content: string, start: number, tokens: AttributeToken[], positionMapper: PositionMapper) {
  const match = content.match(spaceReg)

  if (!match) return

  return match[0].length
}

function tokenizeAttrs(content: string, start: number, positionMapper: PositionMapper) {
  const tokens: AttributeToken[] = []

  while (content.length) {
    const offset =
      tokenizeAttr(content, start, tokens, positionMapper) || tokenizeSpace(content, start, tokens, positionMapper)

    if (!offset) {
      throw new Error('unexpected token ' + content)
    }

    start += offset
    content = content.substring(offset)
  }

  return tokens
}

/**
 * 分词，将 wxml 切分为 Token
 */
export function tokenize(fileName: string, content: string): Token[] {
  const tokens: Token[] = []
  let start = 0

  const positionMapper = getPositionMapper(fileName, content)

  while (content.length) {
    const lastToken = tokens[tokens.length - 1]

    let offset: number | undefined

    if (lastToken && lastToken.type === 'startTag' && rawTextSet.has(lastToken.tag.val) && !lastToken.unary) {
      // 如果是包含任意元素的 tag，则只解析 text 和自己的 end tag
      offset =
        tokenizeRawText(lastToken.tag.val, content, start, tokens, positionMapper) ||
        tokenizeRawTextEndTag(lastToken.tag.val, content, start, tokens, positionMapper)
    } else {
      offset =
        tokenizeComment(content, start, tokens, positionMapper) ||
        tokenizeEndTag(content, start, tokens, positionMapper) ||
        tokenizeStartTag(content, start, tokens, positionMapper) ||
        tokenizeText(content, start, tokens, positionMapper)
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

export type WxmlTree = WxmlNode[]

interface WxmlText {
  type: 'text'
  raw?: boolean
  text: string
  token?: TextToken
}

interface WxmlComment {
  type: 'comment'
  content: string
  token?: CommentToken
}

interface WxmlElement {
  type: 'element'
  tag: string
  attrs: { name: string; value?: string; token?: AttributeToken }[]
  startTagToken?: StartTagToken
  endTagToken?: EndTagToken
  children: WxmlTree
}

/**
 * 语法解析，将 wxml 分词后解析为 Wxml 节点树
 */
export function parse(fileName: string, wxml: string): WxmlTree {
  const root = {
    type: 'root' as const,
    children: [] as WxmlTree,
  }
  const stack = new Stack<WxmlElement | typeof root>([root])

  const tokens = tokenize(fileName, wxml)

  for (const token of tokens) {
    switch (token.type) {
      case 'startTag': {
        const elem: WxmlElement = {
          type: 'element',
          tag: token.tag.val,
          attrs: token.attrs.map(token => ({ name: token.name.val, value: token.value?.val, token })),
          startTagToken: token,
          children: [],
        }
        stack.top().children.push(elem)
        if (!token.unary) stack.push(elem)
        break
      }
      case 'endTag': {
        let top = stack.top()
        // 关闭一个 tag 时，找到最近一个对应的 start tag
        while ((top = stack.top()) && top.type === 'element' && top.tag !== token.tag.val) {
          stack.pop()
        }

        if (top.type !== 'element') {
          // 没有找到对应的 start tag
          throw new Error('unexpected end tag ' + token.tag.val)
        }

        top.endTagToken = token
        stack.pop()
        break
      }
      case 'comment': {
        stack.top().children.push({
          type: 'comment',
          content: token.content.val,
          token,
        })
        break
      }
      case 'text': {
        const text = token.text
        if (!text) break

        // if (stack.top().type === 'root') {
        //   // 不能在根节点有 text
        //   throw new Error('unexpected text ' + token.text)
        // }
        stack.top().children.push({
          type: 'text',
          raw: token.raw,
          text: token.text,
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
  ast: WxmlTree,
  handler: {
    begin?: (elem: WxmlNode) => void
    end?: (elem: WxmlNode) => void
  },
): void {
  for (const elem of ast) {
    handler.begin && handler.begin(elem)
    if (elem.type === 'element') walk(elem.children, handler)
    handler.end && handler.end(elem)
  }
}

/**
 * 代码生成
 */
export function codegen(
  ast: WxmlTree,
  options: { sourceMap?: boolean; prevMap?: any; minimize?: boolean } = {},
): { code: string; map: SourceMapGenerator | undefined } {
  const { sourceMap, prevMap, minimize } = {
    sourceMap: false,
    minimize: false,
    ...options,
  }

  const rootNode = new SourceNode()

  const _codegen = (elem: WxmlNode, sourceNode: SourceNode) => {
    switch (elem.type) {
      case 'text': {
        if (!minimize || elem.raw) {
          // 空字符串不生成 sourceMap
          sourceNode.add(posToSourceNode(elem.token?.pos && elem.text.trim() ? elem.token?.pos : undefined, elem.text))
        } else {
          const trimText = elem.text.trim()
          if (trimText) sourceNode.add(posToSourceNode(elem.token?.pos, trimText))
        }
        break
      }
      case 'comment': {
        if (!minimize)
          sourceNode.add(
            // comment 不生成 sourceMap
            posToSourceNode(undefined, ['<!--', elem.content, '-->']),
          )
        break
      }
      case 'element': {
        // startTag
        sourceNode.add(
          posToSourceNode(elem.startTagToken?.pos, [
            '<',
            posToSourceNode(elem.startTagToken?.tag.pos, elem.tag),
            ...elem.attrs.map(attr =>
              posToSourceNode(attr.token?.pos, [
                ' ',
                posToSourceNode(attr.token?.name.pos, attr.name),
                ...(attr.value === undefined ? [] : ['="', posToSourceNode(attr.token?.value?.pos, attr.value), '"']),
              ]),
            ),
            elem.children.length ? '>' : '/>',
          ]),
        )
        // content
        if (elem.children.length) {
          elem.children.forEach(child => _codegen(child, sourceNode))
        }
        // endTag
        if (elem.children.length)
          sourceNode.add(
            posToSourceNode(elem.endTagToken?.pos, ['</', posToSourceNode(elem.endTagToken?.tag.pos, elem.tag), '>']),
          )
        break
      }
    }
  }

  ast.forEach(elem => _codegen(elem, rootNode))

  let code: string, map: SourceMapGenerator | undefined

  if (sourceMap) {
    const result = rootNode.toStringWithSourceMap()
    code = result.code
    map = result.map
  } else {
    code = rootNode.toString()
    map = undefined
  }

  if (map && prevMap) {
    const prevConsumer = new SourceMapConsumer(prevMap)
    map.applySourceMap(prevConsumer)
  }

  return {
    code,
    map,
  }
}
