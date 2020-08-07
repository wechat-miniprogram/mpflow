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
      api.mode = args.dev ? 'development' : 'production'

      const webpackChain = require('webpack-chain')
      const { default: highlight } = await import('cli-highlight')

      const webpackConfigs = await api.resolveWebpackConfigs()

      webpackConfigs.forEach(webpackConfig => {
        const output = webpackChain.toString(webpackConfig)
        console.log(highlight(output, { language: 'js' }))
      })
    },
  )
}

inspect.generator = (api, config) => {
  api.extendPackage({
    scripts: {
      inspect: 'mpflow-service inspect',
    },
  })
}

export default inspect
