import AssetPlugin from './AssetPlugin'
import { ConfigChain } from './ConfigChain'
import ExternalPlugin from './ExternalPlugin'
import LoaderRulesPlugin from './LoaderRulesPlugin'
import { appLoader, pageLoader, pluginLoader } from './loaders'
import ResolverPlugin from './ResolverPlugin'
import target from './target'
import TemplatePlugin from './TemplatePlugin'
import VirtualPlugin from './VirtualPlugin'

class MpflowWebpackPlugin {
  /**
   * @param {import('@mpflow/webpack-plugin').Options} options
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
        data: {
          appId: '',
          compileType: '',
          projectName: '',
          miniprogramRoot: '',
          pluginRoot: '',
          qcloudRoot: '',
          settings: {},
          ...options.program,
        },
      }).apply(compiler)
    }
  }
}

MpflowWebpackPlugin.target = target

MpflowWebpackPlugin.appLoader = appLoader
MpflowWebpackPlugin.pageLoader = pageLoader
MpflowWebpackPlugin.pluginLoader = pluginLoader

MpflowWebpackPlugin.ConfigChain = ConfigChain

module.exports = MpflowWebpackPlugin
