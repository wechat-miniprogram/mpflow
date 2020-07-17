import WeflowPlugin from '@weflow/webpack-plugin'
import { Plugin } from '../PluginAPI'

const ChainedPlugin = require('webpack-chain/src/Plugin')

class PluginWeflow extends ChainedPlugin {
  constructor(parent: any, name: string, type = 'plugin') {
    super(parent, name, type)
  }

  toConfig() {
    // 调用之前把 args 给转成 config
    const originalArgs = this.get('args')
    this.set('args', originalArgs.map((a: any) => a.toConfig ? a.toConfig() : a))

    const config = super.toConfig()

    this.set('args', originalArgs)

    return config
  }
}

const weflow: Plugin = (api, config) => {
  api.configureWebpack(webpackConfig => {
    webpackConfig.plugins
      .getOrCompute('weflow', () => new PluginWeflow(webpackConfig, 'weflow') as any)
      .use(WeflowPlugin, [new WeflowPlugin.ConfigChain() as any])
  })
}

export default weflow
