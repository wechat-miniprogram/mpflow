import FunctionModulePlugin from 'webpack/lib/FunctionModulePlugin'
import LoaderTargetPlugin from 'webpack/lib/LoaderTargetPlugin'
import MiniprogramTemplatePlugin from './MiniprogramTemplatePlugin'

export default function MiniProgramTarget(compiler) {
  new MiniprogramTemplatePlugin({ asyncChunkLoading: true }).apply(compiler)
  new FunctionModulePlugin().apply(compiler)
  new LoaderTargetPlugin('miniprogram').apply(compiler)
}
