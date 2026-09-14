import FlagEntryExportAsUsedPlugin from 'webpack/lib/FlagEntryExportAsUsedPlugin'
import EnableChunkLoadingPlugin from 'webpack/lib/javascript/EnableChunkLoadingPlugin'
import LoaderTargetPlugin from 'webpack/lib/LoaderTargetPlugin'
import ExternalsPlugin from 'webpack/lib/ExternalsPlugin'
import MiniprogramTemplatePlugin from './MiniprogramTemplatePlugin'

// Webpack 5 removed function-valued configuration targets. Install this function
// in `plugins` and use `target: false` to select the miniprogram environment.
export default function MiniProgramTarget(compiler) {
  const output = compiler.options.output
  output.chunkFormat = false
  output.chunkLoading = 'miniprogram'
  EnableChunkLoadingPlugin.setEnabled(compiler, 'miniprogram')
  output.globalObject = 'globalThis'
  output.library = undefined
  output.environment = {
    ...output.environment,
    arrowFunction: false,
    asyncFunction: false,
    bigIntLiteral: false,
    const: false,
    destructuring: false,
    dynamicImport: false,
    dynamicImportInWorker: false,
    forOf: false,
    globalThis: false,
    module: false,
    optionalChaining: false,
    templateLiteral: false,
  }
  new FlagEntryExportAsUsedPlugin(true, 'miniprogram entry exports').apply(compiler)
  new MiniprogramTemplatePlugin().apply(compiler)
  new LoaderTargetPlugin('miniprogram').apply(compiler)
  new ExternalsPlugin('commonjs2', [/^\/__wx__\//]).apply(compiler)
}
