import FunctionModulePlugin from 'webpack/lib/FunctionModulePlugin'
import LoaderTargetPlugin from 'webpack/lib/LoaderTargetPlugin'
import ExternalsPlugin from 'webpack/lib/ExternalsPlugin'
import MiniprogramTemplatePlugin from './MiniprogramTemplatePlugin'

export default function MiniProgramTarget(compiler) {
  new MiniprogramTemplatePlugin({ asyncChunkLoading: true }).apply(compiler)
  new FunctionModulePlugin().apply(compiler)
  new LoaderTargetPlugin('miniprogram').apply(compiler)
  new ExternalsPlugin('commonjs2', [/^\/__wx__\//]).apply(compiler)
}
