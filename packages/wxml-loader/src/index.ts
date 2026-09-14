import { interpolateName } from 'loader-utils'
import path from 'path'
import { LoaderContext } from 'webpack'
import { get_code } from '@mpflow/wxml-parser'
import { preserveHashAlgorithm, urlToRequest } from './utils'

export interface Options {
  context?: string
  name?: string
  outputPath?: string
  esModule?: boolean
  sourceMap?: boolean
  minimize?: boolean
  resolveMustache?: boolean
  importAttributes?: ImportAttribute[]
}

export interface ImportAttribute {
  tag: string
  attribute: string
  importType?: 'child' | 'inline'
}

const defaultImportAttributes: ImportAttribute[] = [
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

const RUNTIME_API_MODULE = '\0<MPFLOW_WXML_LOADER_RUNTIME_API_MODULE>\0'
type SourceMap = Parameters<LoaderContext<Options>['callback']>[2]

const wxmlLoader = function wxmlLoader(this: LoaderContext<Options>, content: string | Buffer, _map: SourceMap) {
  this.async()
  ;(async (): Promise<[string | Buffer, SourceMap?]> => {
    const options = this.getOptions({
      title: 'WXML Loader options',
      type: 'object',
      additionalProperties: false,
      properties: {
        sourceMap: {
          description: 'Enables/Disables generation of source maps',
          type: 'boolean',
        },
        minimize: {
          description: 'Minimize the output',
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
        resolveMustache: {
          description: 'Should transform mustache url to require',
          type: 'boolean',
        },
        importAttributes: {
          description: 'Attributes that indicate how to resolve imports',
          type: 'array',
        },
      },
    })

    const minimize = typeof options.minimize === 'boolean' ? options.minimize : this.mode === 'production'

    const contentStr = typeof content === 'string' ? content : content.toString('utf8')
    const context = options.context || this.rootContext

    const url = interpolateName(
      this as Parameters<typeof interpolateName>[0],
      preserveHashAlgorithm(options.name || '[name].[ext]'),
      {
        context,
        content,
      },
    )

    const outputPath = JSON.stringify(path.posix.join(options.outputPath || '', url))
    const publicPath = `__webpack_public_path__ + ${outputPath}`
    const rustStringifyRequest = (request: string) => {
      // wasm32 has no filesystem root, so Rust's Path::is_absolute cannot preserve root requests.
      if (path.isAbsolute(request)) return JSON.stringify(request)
      return JSON.stringify(
        this.utils.contextify(
          this.context,
          request === RUNTIME_API_MODULE ? require.resolve('./runtime/api') : request,
        ),
      )
    }
    return [
      get_code(
        this.resourcePath,
        contentStr,
        {
          publicPath: publicPath,
          esModule: options.esModule ?? false,
          minimize: options.minimize ?? true,
          resolveMustache: options.resolveMustache ?? false,
          attributes: options.importAttributes ?? defaultImportAttributes,
        },
        rustStringifyRequest,
        urlToRequest,
      ),
    ]
  })().then(
    ([content, sourceMap]) => {
      this.callback(null, content, sourceMap)
    },
    err => {
      this.callback(err)
    },
  )
}

export default wxmlLoader
