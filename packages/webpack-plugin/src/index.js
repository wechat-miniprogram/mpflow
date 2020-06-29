import MpResolverPlugin from './ResolverPlugin'
import MpAssetPlugin from './AssetPlugin'
import MpVirtualPlugin from './VirtualPlugin'
import { appLoader, pageLoader, externalLoader, assetLoader } from './loaders'

class MpPlugin {
  constructor(options) {
    this.options = options
  }

  apply(compiler) {
    const options = this.options

    new MpResolverPlugin(options).apply(compiler)
    new MpVirtualPlugin(options).apply(compiler)
    new MpAssetPlugin(options).apply(compiler)
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

MpPlugin.appLoader = appLoader
MpPlugin.pageLoader = pageLoader
MpPlugin.externalLoader = externalLoader
MpPlugin.assetLoader = assetLoader

export default MpPlugin
