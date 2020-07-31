import AssetPlugin from './AssetPlugin'
import { ConfigChain } from './ConfigChain'
import ExternalPlugin from './ExternalPlugin'
import LoaderRulesPlugin from './LoaderRulesPlugin'
import { appLoader, pageLoader, pluginLoader } from './loaders'
import ResolverPlugin from './ResolverPlugin'
import target from './target'
import TemplatePlugin from './TemplatePlugin'
import VirtualPlugin from './VirtualPlugin'

class WeflowWebpackPlugin {
  /**
   * @param {import('@weflow/webpack-plugin').Options} options
   */
  constructor(options = {}) {
    this.options = options
  }

  apply(compiler) {
    const options = this.options

    new AssetPlugin().apply(compiler)
    new VirtualPlugin().apply(compiler)
    new ExternalPlugin().apply(compiler)
    new ResolverPlugin(options.resolve).apply(compiler)
    new LoaderRulesPlugin(options.rules).apply(compiler)

    if (options.program) {
      options.program.outputPath = options.program.outputPath || 'project.config.json'
      new TemplatePlugin({
        templatePath: require.resolve('../template/project.config.json.ejs'),
        outputPath: options.program.outputPath,
        data: options.program,
      }).apply(compiler)
    }
  }
}

WeflowWebpackPlugin.target = target

WeflowWebpackPlugin.appLoader = appLoader
WeflowWebpackPlugin.pageLoader = pageLoader
WeflowWebpackPlugin.pluginLoader = pluginLoader

WeflowWebpackPlugin.ConfigChain = ConfigChain

export default WeflowWebpackPlugin
