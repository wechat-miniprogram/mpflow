import MpResolverPlugin from './ResolverPlugin'
import MpAppPlugin from './AppPlugin'
import MpPagePlugin from './PagePlugin'
import MpConfigPlugin from './ConfigPlugin'
import MpVirtualPlugin from './VirtualPlugin'

class MpPlugin {
  constructor(options) {
    this.options = options
  }

  apply(compiler) {
    const options = this.options

    new MpResolverPlugin(options).apply(compiler)
    new MpAppPlugin(options).apply(compiler)
    new MpVirtualPlugin(options).apply(compiler)
    new MpPagePlugin(options).apply(compiler)
    new MpConfigPlugin(options).apply(compiler)
  }
}

const MpTarget = compiler => {
  const NodeTemplatePlugin = require('webpack/lib/node/NodeTemplatePlugin')
  const FunctionModulePlugin = require('webpack/lib/FunctionModulePlugin')
  const NodeSourcePlugin = require('webpack/lib/node/NodeSourcePlugin')
  const LoaderTargetPlugin = require('webpack/lib/LoaderTargetPlugin')
  new NodeTemplatePlugin().apply(compiler)
  new FunctionModulePlugin().apply(compiler)
  new NodeSourcePlugin(compiler.options.node).apply(compiler)
  new LoaderTargetPlugin('web').apply(compiler)
}
MpPlugin.target = MpTarget

export default MpPlugin
