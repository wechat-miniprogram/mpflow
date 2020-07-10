import MpResolverPlugin from './ResolverPlugin'
import MpAssetPlugin from './AssetPlugin'
import MpVirtualPlugin from './VirtualPlugin'
import { appLoader, pageLoader, externalLoader, assetLoader } from './loaders'

class WeflowWebpackPlugin {
  constructor(options = {}) {
    this.options = options
  }

  apply(compiler) {
    const options = this.options

    new MpResolverPlugin(options.resolve).apply(compiler)
    new MpVirtualPlugin(options).apply(compiler)
    new MpAssetPlugin(options).apply(compiler)
  }
}

function WeflowMiniProgramTarget(compiler) {
  const NodeTemplatePlugin = require('webpack/lib/node/NodeTemplatePlugin')
  const FunctionModulePlugin = require('webpack/lib/FunctionModulePlugin')
  const NodeSourcePlugin = require('webpack/lib/node/NodeSourcePlugin')
  const LoaderTargetPlugin = require('webpack/lib/LoaderTargetPlugin')
  new NodeTemplatePlugin().apply(compiler)
  new FunctionModulePlugin().apply(compiler)
  new NodeSourcePlugin(compiler.options.node).apply(compiler)
  new LoaderTargetPlugin('web').apply(compiler)
}
WeflowWebpackPlugin.target = WeflowMiniProgramTarget

WeflowWebpackPlugin.appLoader = appLoader
WeflowWebpackPlugin.pageLoader = pageLoader
WeflowWebpackPlugin.externalLoader = externalLoader
WeflowWebpackPlugin.assetLoader = assetLoader

export default WeflowWebpackPlugin
