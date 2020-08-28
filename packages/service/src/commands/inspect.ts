import { Plugin } from '@mpflow/service-core'

const inspect: Plugin = api => {
  api.registerCommand(
    'inspect',
    '检查 webpack 配置',
    {},
    {
      dev: {
        boolean: true,
        description: '是否使用开发模式构建',
      },
    },
    async args => {
      api.setMode(args.dev ? 'development' : 'production')

      const webpackChain = require('webpack-chain') as typeof import('webpack-chain')
      const { default: highlight } = require('cli-highlight') as typeof import('cli-highlight')

      const webpackConfigs = Object.values(await api.resolveWebpackConfigs())

      webpackConfigs.forEach(webpackConfig => {
        const output = (webpackChain as any).toString(webpackConfig)
        console.log(highlight(output, { language: 'js' }))
      })
    },
  )
}

export default inspect
