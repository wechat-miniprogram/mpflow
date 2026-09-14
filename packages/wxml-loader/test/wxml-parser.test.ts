import { get_code, WxmlParserOptions } from '@mpflow/wxml-parser'
import createWxmlModule from '../src/runtime/api'

const runtimeRequest = '\0<MPFLOW_WXML_LOADER_RUNTIME_API_MODULE>\0'

function compileTemplate(content: string, options: Partial<WxmlParserOptions> = {}, imports: Record<string, any> = {}) {
  const code = get_code(
    'a.wxml',
    content,
    {
      publicPath: JSON.stringify('a.wxml'),
      esModule: false,
      minimize: false,
      resolveMustache: false,
      attributes: [],
      ...options,
    },
    JSON.stringify,
    (url: string) => url,
  )
  const module = { id: 'a', exports: {} as ReturnType<typeof createWxmlModule> }
  const requireModule = (request: string) => {
    if (request === runtimeRequest) return createWxmlModule
    if (Object.prototype.hasOwnProperty.call(imports, request)) return imports[request]
    throw new Error(`Unexpected parser import: ${request}`)
  }
  new Function('require', 'module', 'exports', code)(requireModule, module, module.exports)
  return module.exports
}

describe('Rust wxml parser', () => {
  // These cases exercise the published get_code API after the old tokenizer was replaced.
  test.each([
    ['unary tag', '<a />', '<a />\n'],
    ['empty tag', '<a></a>', '<a />\n'],
    ['tag attrs', '<a src="123" bar="bar" s-t-m />', '<a src="123" bar="bar" s-t-m />\n'],
    ['tag text', '<a>he llo</a>', '<a>he llo</a>\n'],
    ['multiline text', '<a>he\n llo\n world</a>', '<a>he\n llo\n world</a>\n'],
    ['comment', '<!-- this is a comment -->', '<!-- this is a comment -->\n'],
    ['nested tags', '<a><b /></a>', '<a>\n    <b />\n</a>\n'],
    ['raw wxs text', '<wxs module="x"><>\n2</><a/></wxs>', '<wxs module="x"><>\n2</><a/></wxs>\n'],
  ])('compiles %s', (_name, input, expected) => {
    expect(compileTemplate(input).exports).toEqual([['a', expected, 'a.wxml', undefined]])
  })

  test('replaces asset URLs and includes the child template exports', () => {
    const child = createWxmlModule()
    child.e('child', '<text>child</text>', 'child.output.wxml', undefined)
    Object.assign(child, { url: 'child.output.wxml' })

    const result = compileTemplate(
      '<import src="./child.wxml"/><image src="./image.png"/>',
      {
        minimize: true,
        attributes: [
          { tag: 'import', attribute: 'src', importType: 'child' },
          { tag: 'image', attribute: 'src' },
        ],
      },
      { './child': child, './image.png': 'image.output.png' },
    )

    expect(result.exports).toEqual([
      ['child', '<text>child</text>', 'child.output.wxml', undefined],
      ['a', '<import src="child.output.wxml"/><image src="image.output.png"/>', 'a.wxml', undefined],
    ])
  })

  test('preserves dynamic image URLs when mustache resolution is disabled', () => {
    expect(
      compileTemplate('<image src="img/m-{{id}}.png"/>', {
        minimize: true,
        attributes: [{ tag: 'image', attribute: 'src' }],
      }).exports,
    ).toEqual([['a', '<image src="img/m-{{id}}.png"/>', 'a.wxml', undefined]])
  })
})
