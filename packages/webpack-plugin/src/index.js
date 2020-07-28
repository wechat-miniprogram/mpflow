import { ConfigChain } from './ConfigChain'
import LoaderRulesPlugin from './LoaderRulesPlugin'
import { appLoader, pageLoader, pluginLoader } from './loaders'
import ResolverPlugin from './ResolverPlugin'
import TemplatePlugin from './TemplatePlugin'

class WeflowWebpackPlugin {
  /**
   * @param {import('@weflow/webpack-plugin').Options} options
   */
  constructor(options = {}) {
    this.options = options
  }

  apply(compiler) {
    const options = this.options

    new ResolverPlugin(options.resolve).apply(compiler)
    new LoaderRulesPlugin(options.rules).apply(compiler)
    if (options.templates) new TemplatePlugin(options.templates).apply(compiler)
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
WeflowWebpackPlugin.pluginLoader = pluginLoader

WeflowWebpackPlugin.ConfigChain = ConfigChain

export default WeflowWebpackPlugin
