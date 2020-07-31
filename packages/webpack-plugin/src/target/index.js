import JsonpTempaltePlugin from 'webpack/lib/web/JsonpTemplatePlugin'
import FunctionModulePlugin from 'webpack/lib/FunctionModulePlugin'
import LoaderTargetPlugin from 'webpack/lib/LoaderTargetPlugin'

export default function MiniProgramTarget(compiler) {
  new JsonpTempaltePlugin().apply(compiler)
  new FunctionModulePlugin().apply(compiler)
  new LoaderTargetPlugin('miniprogram').apply(compiler)
}
